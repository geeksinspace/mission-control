package bot.services

import bot.Bot
import bot.control.Service

@Grab("com.sparkjava:spark-core:2.0.0")
import spark.Spark

/**
 * The mission control www service
 */
class WWWService extends Service {
    
    def config = Bot.CONFIG.www
    def http

    public WWWService(){
        super("www", true, 9)

        if(this.config.docPath){
            Spark.externalStaticFileLocation(this.config.docPath)
        }else{
            LOG.error "No www.docPath config for www service"
        }

        Spark.setPort(this.config.port)
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
        Spark.get("/hello", { req, resp ->
            return "Hello World!"
        })
    }
    
    @Override
    public void onStop(){
        Spark.stop()
    }
}
