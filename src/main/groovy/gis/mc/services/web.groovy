package bot.services

import bot.Bot
import bot.control.Service

@Grab("com.sparkjava:spark-core:2.0.0")
import spark.Spark

/**
 * The mission control web service
 */
class WebService extends Service {
    
    public WebService(){
        super("web", true, 9)
    }
    
    @Override
    public void onStart(){
        Spark.get("/status", { req, resp ->
            // Show server status
            return "STATUS NOT IMPLEMENTED YET"
        })
        Spark.get("/capsule", { req, resp ->
            // The capsule webservice interface
            return "CAPSULE WEBSERVICE NOT IMPLEMENTED YET"
        })
        Spark.get("/ping", { req, resp ->
            return "pong"
        })
    }
    
    @Override
    public void onStop(){
        Spark.stop()
    }
}
