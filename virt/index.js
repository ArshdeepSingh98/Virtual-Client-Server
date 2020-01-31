const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const os = require('os');
var plotly = require('plotly')("Arshdeep", "LjklcOEk58REA3IdHhP2")

const app = express();

const SELECT_ALL_PRODUCTS_QUERY = 'SELECT * FROM products';

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'react_sql'
});

connection.connect(err => {
	if(err) {
		return err;   
	}
});

app.use(cors());

// data for displaying request vs time graph
var yData = [];
var xData = [];

// collect request info
var requests = [];
var requestTrimThreshold = 5000;
var requestTrimSize = 4000;
app.use(function(req, res, next) {
    requests.push(Date.now());

    // now keep requests array from growing forever
    if (requests.length > requestTrimThreshold) {
        requests = requests.slice(0, requests.length - requestTrimSize);
    }
    next();
});

// logging how many requests in last second
function throughputLogger() {
    var now = new Date();
    var aMinuteAgo = now - (1000);
    var cnt = 0;
    // since recent requests are at the end of the array, search the array
    // from back to front
    for (var i = requests.length - 1; i >= 0; i--) {
        if (requests[i] >= aMinuteAgo) {
            ++cnt;
        } else {
            break;
        }
    }
    yData.push(cnt);
    xData.push(now.getMinutes() + ':' + now.getSeconds());
    console.log("Throughput: ", cnt)
	setTimeout(throughputLogger, 1000)  
};

throughputLogger()

// send throughput graph data to client to show
app.get('/graph', (req, res) => {
	var data = [{
		x:xData, 
		y:yData, 
		mode: "lines",
		type: 'scatter'
	}];
	var layoutOptions = {
		title: "Throughput vs Time Graph",
		xaxis: {
			title: "Time",
			showgrid: false,
			zeroline: false
		},
		yaxis: {
			title: "Throughput",
			showline: false
		}
	}
	var graphOptions = {fileopt : "overwrite", filename : "throughput-graph", layout : layoutOptions};

	plotly.plot(data, graphOptions, function (err, msg) {
		if (err) return console.log(err);
		console.log(msg);
	});
	res.send('use link in console to view graph')
})


// base endpoint for server
app.get('/', (req, res) => {
	res.send('go to /products to see products')
})

// add product in server
app.get('/products/add', (req, res) => {
	let {name, price} = req.query;
	let INSERT_PRODUCTS_QUERY = `INSERT INTO products (name, price) values ('${name}', '${price}')`;
	connection.query(INSERT_PRODUCTS_QUERY, (err, results) => {
		if(err){
			return res.send(err)
		} else {
			return res.send('successfully added product')
		}
	})
})

// show products on server 
app.get('/products', (req, res) => {
	connection.query(SELECT_ALL_PRODUCTS_QUERY, (err, results) => {
	  	if(err){
	   		return res.send(err)
	  	} else {
	   		return res.json({data: results})
	  	}
 	})
})

app.listen(4000, () => {
  console.log('Products server listening on port 4000')
})

//Create function to get CPU information
function cpuAverage() {

  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();

  //Loop through CPU cores
  for (var i = 0, len = cpus.length; i < len; i++) {
    //Select CPU core
    var cpu = cpus[i];
    //Total up the time in the cores tick
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    //Total up the idle time of the core
    totalIdle += cpu.times.idle;
  }
  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length, total: totalTick / cpus.length};
}

// function to calculate average of array
const arrAvg = function (arr) {
  if (arr && arr.length >= 1) {
    const sumArr = arr.reduce((a, b) => a + b, 0)
    return sumArr / arr.length;
  }
};

// load average for the past 1000 milliseconds calculated every 100
function getCPULoadAVG(avgTime = 1000, delay = 100) {

  return new Promise((resolve, reject) => {
    const n = ~~(avgTime / delay);
    if (n <= 1) {
      reject('Error: interval to small');
    }

    let i = 0;
    let samples = [];
    const avg1 = cpuAverage();
    
    let interval = setInterval(() => {
      // console.debug('CPU Interval: ', i);
      if (i >= n) {
        clearInterval(interval);
        resolve(~~((arrAvg(samples) * 100)));
      }
      const avg2 = cpuAverage();
      const totalDiff = avg2.total - avg1.total;
      const idleDiff = avg2.idle - avg1.idle;
      samples[i] = (1 - idleDiff / totalDiff);
      i++;
    }, delay);

  });
}

// calculate cpu load every 2 seconds
function cpuLogger() {
	getCPULoadAVG(1000, 100).then(console.log)
	setTimeout(cpuLogger, 2000)
}

// cpuLogger()




			
