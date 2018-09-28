import AWS from 'aws-sdk';

console.log('Loading function');

const lambdaHandler = (event, context) => {
  console.log(`Received event: ${JSON.parse(event)}`);

  // get autoscaling client
  const client = new AWS.AutoScaling();
};
