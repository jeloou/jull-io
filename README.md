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
 
### Getting started 

Run locally: 
    
    $ git clone https://github.com/jeloou/jull-io.git
    $ cd jull-io
    $ npm install
    $ npm start

Visit [localhost:3000](http://localhost:3000/) to marvel at your work. You should have a new and 
shining instance running locally.  

In order to access to the API functionality you need to create a new user. There's a simple form in [localhost:3000/signup](http://localhost:3000/signup)  that will help with this task. After that, you can start by adding new devices (I'm using [httpie](https://github.com/jakubroztocil/httpie) in those examples)

    $ http post localhost:3000/things name="drone" description="white quadcopter" 'Cookie:_jull.io=<your cookie>'
    
    {
      "id": "53d451ee935a7df5290a91f9", 
      "name": "drone", 
      "description": "white quadcopter", 
      "key": {
        "key": "0b281230-152b-11e4-a5b7-f950974c1402", 
        "token": "1840wvv8sk54gqfreief1augkqwa5rk9"
      }, 
      "user": {
        "email": "joseph@jull.io", 
        "first_name": "Joseph", 
        "last_name": "Núñez", 
        "things": [
          "0b281230-152b-11e4-a5b7-f950974c1402"
        ]
      }
    }
   

The returned data contains a `key` and a `token` that your device can use as `username` and `password` to connect to the MQTT server. Other methods are also available:

    $ http get localhost:3000/things 'Cookie:_jull.io=<your cookie>'
    
    [
       /* returns a list of things */
    ]
    
    $ http put localhost:3000/things/0b281230-152b-11e4-a5b7-f950974c1402 description="black quadcopter" 'Cookie:_jull.io=<your cookie>'
    
    {
      "id": "53d451ee935a7df5290a91f9", 
      "name": "drone", 
      "description": "black quadcopter", 
      "key": {
        "key": "0b281230-152b-11e4-a5b7-f950974c1402", 
        "token": "1840wvv8sk54gqfreief1augkqwa5rk9"
      }, 
      "user": {
        "email": "joseph@jull.io", 
        "first_name": "Joseph", 
        "last_name": "Núñez", 
        "things": [
           "0b281230-152b-11e4-a5b7-f950974c1402"
        ]
      }
    }

    $ http delete localhost:3000/things/0b281230-152b-11e4-a5b7-f950974c1402 'Cookie:_jull.io=<your cookie>'
   

Once you've all this ready, It's time to create a couple of fences, which is pretty simple:


    $ http post localhost:3000/fences name="fence" description="just a fence" boundaries:='[[10.4953492, -66.87594589999998], [10.485896847519571, -66.88049492648923], [10.489779098659216, -66.86865029147947], [10.4953492, -66.87594589999998]]' 'Cookie:_jull.io=<your cookie>'
    
    {
      "boundaries": [
        /*  lat, lng */
        [10.4953492, -66.87594589999998], 
        [10.485896847519571, -66.88049492648923], 
        [10.489779098659216, -66.86865029147947], 
        [10.4953492, -66.87594589999998]
      ], 
      "description": "just a fence", 
      "id": "53d5bc0c2b40de2954ec9fc3", 
      "name": "fence", 
      "user": "53d5abf190721f224f4f9d41"
    }

Remember you need to finish of the list points with the same point you started it. So, now every device located inside this fence will generate a notification. 

### Contributing 
This project is in active development but it's not ready. Feel free to open a pull request with a nice feature or a fix for some bug.

### License

See the `LICENSE` file.
