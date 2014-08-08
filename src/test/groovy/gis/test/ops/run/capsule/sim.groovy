#!/usr/bin/groovy
// Run a capsule simulation
// usage: sim <mc-url>
package gis.test.ops

import bot.util.TimeTool

@Grab("com.google.code.gson:gson:2.2.4")
import com.google.gson.Gson

@Grab("org.codehaus.groovy.modules.http-builder:http-builder:0.7")
import groovyx.net.http.AsyncHTTPBuilder
import static groovyx.net.http.ContentType.*
import static groovyx.net.http.Method.*

def url = args[0]

// Some bits to help with the sim
def rng = new Random(10111100)
def pos = [ rng.nextFloat(), rng.nextFloat(), rng.nextFloat()*100 ]
def timer = new TimeTool()
def http = new AsyncHTTPBuilder(poolSize: 4, uri: url, timeout: 1000)
def nextFloat = { c, r -> return c+(r-(rng.nextFloat()*(r*2))) } 
def normalise = { n, hi, low -> return (n>hi) ? hi : (n<low) ? low : n }
def move = 1

BOT.on("gis.sim.post", { comm ->
    // Update values, movement in range, always going up
    pos = [
        normalise(nextFloat(pos[0], move), 90, -90),
        normalise(nextFloat(pos[1], move), 90, -90),
        pos[2]+rng.nextFloat()*move
    ]

    LOG.info "Updating position to ${pos}"
    http.request(POST, JSON){
        body = [ "long": pos[0], "lat": pos[1], "alt": pos[2], 
            "ts": System.currentTimeMillis() ]
    
        response.success = { resp, json ->
            LOG.info "Done: $json"
        }
    }


})

LOG.info "Simulating capsule updates to $url"
timer.interval({ BOT.comm "gis.sim.post" }, 1);

BOT.join()
