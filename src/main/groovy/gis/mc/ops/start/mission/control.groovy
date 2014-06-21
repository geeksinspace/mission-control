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

// Start the services
LOG.info "Starting mission control services"
BOT.comm("srv.loader.start", { LOG.info "Started all services"})

// Join the bot
BOT.join()
