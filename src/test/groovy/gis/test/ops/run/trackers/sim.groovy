#!/usr/bin/groovy
// Run a trackers simulation
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
def trackerCount = (args.size() >= 2) ? args[1] as int : 5 

// Some bits to help with the sim
def rng = new Random(10111100)
def timer = new TimeTool()
def http = new AsyncHTTPBuilder(poolSize: 4, uri: url, timeout: 1000)
def nextFloat = { c, r -> return c+(r-(rng.nextFloat()*(r*2))) } 
def normalise = { n, hi, low -> return (n>hi) ? hi : (n<low) ? low : n }
def move = 1

// Create starting positions for all trackers
def pos = []
(0..trackerCount).each { 
    pos << [ rng.nextFloat()*10, rng.nextFloat()*10, rng.nextFloat()*100 ]
}

BOT.on("gis.sim.post", { comm ->
    // Update values, movement in range, always going up
    def tracker = (rng.nextFloat()*(pos.size()-1)) as int
    pos[tracker] = [
        normalise(nextFloat(pos[tracker][0], move), 90, -90),
        normalise(nextFloat(pos[tracker][1], move), 90, -90),
        pos[tracker][2]+rng.nextFloat()*move
    ]

    http.request(POST, JSON){
        body = [
            "name": "tracker-${tracker}" as String, 
            "long": pos[tracker][0], 
            "lat": pos[tracker][1], 
            "alt": pos[tracker][2], 
            "ts": System.currentTimeMillis() 
        ]
    
        response.success = { resp, json ->
            LOG.info "Done: $json"
        }
    }
})

LOG.info "Simulating capsule updates to $url"
timer.interval({ BOT.comm "gis.sim.post" }, 2);

BOT.join()
