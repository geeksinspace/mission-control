#!/usr/bin/groovy
// Start mission control
package git.mc.ops.start.mission

import bot.control.sh.Botsh

// Print header
println ""
println "#### ###  ### "
println "#     #  #    "
println "# ##  #   ## "
println "#  #  #     #  #####################################"
println "#### ### ###     Geeks In Space - Mission Control  #"
println "" 

LOG.debug "CONFIG: ${BOT.CONFIG}"

// Start the services
LOG.info "Starting mission control services"
BOT.comm("srv.loader.start", { 
    LOG.info "Services loaded"

    // Start all data services
    BOT.comm("srv.graph.start", { LOG.info "Graph started" })
    BOT.comm("srv.www.start", { 
        LOG.info "WWW started"
        BOT.comm("srv.web.start", { LOG.info "Webservices started" })
    })
})

// Join the bot
BOT.join()
