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
  
    private static final END_OBJECT = new Object()

    def dataHandler = new JsonTransformer()

    def getCapsuleData = { req, res ->
        try{
            def dataQueue = new LinkedBlockingDeque()
            
            // Ask for all the data
            new Comm("srv.graph.read")
                .set(GraphService.NODE_LABEL, "Location")
                .publish({ comm ->
                    LOG.debug "Got ${comm.get(GraphService.OP_RESULT).size()}"
                    comm.get(GraphService.OP_RESULT).each { dataQueue << it }
                    dataQueue << END_OBJECT
                })
   
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
