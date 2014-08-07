package bot.services

import bot.Bot
import bot.comm.Comm
import bot.control.Service
import bot.services.GraphService

import java.util.concurrent.*

@Grab("com.sparkjava:spark-core:2.0.0")
import spark.*

@Grab("com.google.code.gson:gson:2.2.4")
import com.google.gson.Gson

/**
 * The mission control web service
 */
class WebService extends Service {

    private static final DATA_QUEUE = "gis.ws.dataqueue"
    private static final END_OBJECT = new Object()

    // Graph data constants
    private static final FIELD_TIME = "ts"

    // Types
    private static final CAPSULE_LOCATION = "Capsule"
    private static final TRACKER_LOCATION = "Tracker"
    
    def dataHandler = new JsonTransformer()

    // Translate a map to a cypher query properties
    def toCypherProps = { id, map ->
        LOG.debug "Getting props for ${map}"

        def props = ""
        map.each { k, v -> props += "${id}.${k} = \"${v}\", " }

        LOG.debug "Props for ${map} are ${props}"
        return props.substring(0,props.length()-2)
    }

    // Generate a query to gather the last "num" locations
    def recentLocQuery = { num, type ->
        return """ MATCH (n:$type) RETURN *
                ORDER BY n.${FIELD_TIME} DESC 
                LIMIT ${num}"""
    }

    // Generate a query to update data entry
    def updateDataQuery = { type, name, props ->
        return """ MERGE (n:$type {name: '$name'})
                ON MATCH SET ${toCypherProps("n", props)}"""
    }

    def queueResponseData = { comm ->
        LOG.debug "${comm.get(GraphService.OP_RESULT).size()}"
        comm.get(GraphService.OP_RESULT).each { 
            comm.get(DATA_QUEUE) << it 
        }
        comm.get(DATA_QUEUE) << END_OBJECT
    }
    
    def getLocationData = { req, res, type ->
        try{
            def dataQueue = new LinkedBlockingDeque()
           
            def path = req.pathInfo()
            def bits = path.split("/")
            LOG.debug "Getting casule data for ${bits}"

            if(bits.size() <= 2 || bits[2] == "" ){
                // Ask for all the data
                new Comm("srv.graph.read")
                    .set(GraphService.NODE_LABEL, type)
                    .set(DATA_QUEUE, dataQueue)
                    .publish(queueResponseData)
            }else if(bits[2] == "current"){
                def num = (bits.size() <= 3 || bits[3] == 0) ? 1 : bits[3]
                new Comm("srv.graph.query")
                    .set(GraphService.GRAPH_QUERY, recentLocQuery(num, type))
                    .set(DATA_QUEUE, dataQueue)
                    .publish(queueResponseData)
            }
   
            // Convert the queue into a list for the response
            def response = []
            while(true){
                def obj = dataQueue.take()
                if(obj == END_OBJECT) break
                LOG.debug "Adding ${obj} to response"
                response << obj
            }

            // Return the list
            LOG.debug "Done! Returning ${response}"
            def result = dataHandler.render(response)
            return result
        }catch(Throwable t){
            LOG.error "Failed to get capsule data ${t}"
            def crapIcon = "https://cdn1.iconfinder.com/data/icons/pidginsmilies/poop.png"
            Spark.halt(500, "<img src=\"${crapIcon}\"/> Ah crap!")
        }
    }

    def addLocationData = { req, res, type ->
        try{
            def props = dataHandler.derenderToMap(req.body())
            new Comm("srv.graph.create")
                .set(GraphService.NODE_LABEL, type)
                .set(GraphService.NODE_PROPS, props)
                .publish()
        }catch(e){y
            LOG.error "Failed to add $type data ${e}"
        }
        return "{}"
    }

    def setLocationData = { req, res, type ->
        try{
            def props = dataHandler.derenderToMap(req.body())
            def update = updateDataQuery(type, props.name, props)
            new Comm("srv.graph.query")
                .set(GraphService.GRAPH_QUERY, update)
                .publish()
        }catch(e){
            LOG.error "Failed to set $type data ${e}"
        }
        return "{}"
    }

    public WebService(){
        super("web", true, 9)
    }
    
    @Override
    public void onStart(){
        Spark.get("/status", { req, resp ->
            // Show server status
            return "STATUS NOT IMPLEMENTED YET"
        })
        Spark.get("/ping", { req, resp ->
            return "pong"
        })

        // The capsule webservices
        Spark.get("/capsule", "application/json", { req, res ->
            return getLocationData(req, res, CAPSULE_LOCATION)})
        Spark.get("/capsule/*", "application/json", { req, res -> 
            return getLocationData(req, res, CAPSULE_LOCATION)})
        Spark.post("/capsule", { req, res -> 
            return addLocationData(req, res, CAPSULE_LOCATION)})
    
        // The trackers webservices
        Spark.get("/trackers", "application/json", { req, res ->
            return getLocationData(req, res, TRACKER_LOCATION)})
        Spark.post("/trackers", { req, res ->
            return setLocationData(req, res, TRACKER_LOCATION)})
    }
    
    @Override
    public void onStop(){
        Spark.stop()
    }

    // Data conversion (should probably be in core)
    public class JsonTransformer implements ResponseTransformer {
        
        private Gson gson = new Gson()

        @Override
        public String render(model){
            WebService.this.LOG.debug "Rendering ${model} to json"
            return gson.toJson(model)
        }

        public String renderList(map){
           return "" 
        }

        public String renderMap(map){
            def response = new StringBuilder("{\n")
            model.each { entry ->
                response << "{ \"id\": \"${entry.key}\", "
                entry.value.each { k, v ->
                    response << "\"${k}\": \"${v}\", " 
                }
                response << " },\n"
            }
            return "${response}}"
        }

        public Map derenderToMap(String json){
            return gson.fromJson(json, Map.class)
        }

    }
}
