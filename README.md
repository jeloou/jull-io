# jull-io

jull.io is a processing back-end and API for the [mosca](https://github.com/mcollina/mosca) MQTT broker.

### What can you do with it? 

You can turn anything into a real-time geo-aware thing, giving it the 
ability to detect the proximity of other things, know when it arrive or leave a 
place and broadcast messages. The API gives you a detailed storyline that shows 
where, when, and how much your thing moves, along with sensor readings, speed, 
duration and distance statistics.

### Requierements 

jull.io uses MongoDB >= 2.4.10 for all the geo-related operations, storing data and
sessions. Redis >= 2.6.16 for the job queue. In order to connect jull.io to [mosca](https://github.com/mcollina/mosca) you will need to run it using [mqtt-cli](https://github.com/jeloou/mqtt-cli).
 
## Getting started 

Run locally: 
    
    $ git clone https://github.com/jeloou/jull-io.git
    $ cd jull-io
    $ npm install
    $ npm start

Visit <http://localhost:3000> to marvel at your work. You should have a new and 
shining instance running locally.

### Contributing 
This project is in active development but it's not ready. Feel free to open a pull request with a nice feature or a fix for some bug.

### License

See the `LICENSE` file.
