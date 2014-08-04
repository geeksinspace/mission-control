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
    
    def dataHandler = new JsonTransformer()

    // Generate a query to gather the last "num" locations
    def recentLocQuery = { num ->
        return """ MATCH (n:Location) RETURN *
                ORDER BY n.${FIELD_TIME} DESC 
                LIMIT ${num}"""
    }

    def queueResponseData = { comm ->
        LOG.debug "${comm.get(GraphService.OP_RESULT).size()}"
        comm.get(GraphService.OP_RESULT).each { 
            comm.get(DATA_QUEUE) << it 
        }
        comm.get(DATA_QUEUE) << END_OBJECT
    }
    
    def getCapsuleData = { req, res ->
        try{
            def dataQueue = new LinkedBlockingDeque()
           
            def path = req.pathInfo()
            def bits = path.split("/")
            LOG.debug "Getting casule data for ${bits}"

            if(bits.size() <= 2 || bits[2] == "" ){
                // Ask for all the data
                new Comm("srv.graph.read")
                    .set(GraphService.NODE_LABEL, "Location")
                    .set(DATA_QUEUE, dataQueue)
                    .publish(queueResponseData)
            }else if(bits[2] == "current"){
                def num = (bits.size() <= 3 || bits[3] == 0) ? 1 : bits[3]
                new Comm("srv.graph.query")
                    .set(GraphService.GRAPH_QUERY, recentLocQuery(num))
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
            Spark.halt(500, "<img src=\"crap.png\"/> Ah crap!")
        }
    }

    def addCapsuleData = { req, res ->
        try{
            def props = dataHandler.derenderToMap(req.body())
            new Comm("srv.graph.create")
                .set(GraphService.NODE_LABEL, "Location")
                .set(GraphService.NODE_PROPS, props)
                .publish()
        }catch(e){
            LOG.error "Failed to add capsule data ${e}"
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
            return getCapsuleData(req, res)})
        Spark.get("/capsule/*", "application/json", { req, res -> 
            return getCapsuleData(req, res)})
        Spark.post("/capsule", { req, res -> 
            return addCapsuleData(req, res)})
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
