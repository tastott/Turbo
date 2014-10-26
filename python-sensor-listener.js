var childProcess = require('child_process');

function InputListener(pin){
	var self = this;
	var gpioProcess;

	self.start = function(onInput){
		gpioProcess = childProcess.spawn('python',['test.py']);
		gpioProcess.stdout.on('data', function(data){
			onInput(data);
		});		
		gpioProcess.stderr.on('data', function(data){
			console.log('Error in python process: ' + data);
		});

	}

	self.stop = function(callback){
		gpioProcess.kill();
		callback();
	}	
}

exports.InputListener = InputListener;
