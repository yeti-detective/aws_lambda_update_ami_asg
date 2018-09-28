const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

console.log('Loading function');

const twoChar = time => {
  return time < 10 ? `0${time}` : time.toString();
};

const getTimeStampString = date => {
  const yyyymmdd = date.toISOString().slice(0, 10);
  const hh = twoChar(date.getHours());
  const mm = twoChar(date.getMinutes());
  const ss = twoChar(date.getSeconds());
  return `${yyyymmdd} ${hh}-${mm}-${ss}`;
};

exports.handler = event => {
  console.log(`Received event: ${JSON.stringify(event)}`);

  // get autoscaling client
  const client = new AWS.AutoScaling();

  // get object for the ASG we're going to update, filter by name of target ASG
  client.describeAutoScalingGroups(
    {
      AutoScalingGroupNames: [event.targetASG]
    },
    (err, data) => {
      if (err) {
        console.error(err);
      } else {
        if (!data.AutoScalingGroups) {
          return `Invalid ASG name: ${event.targetASG}`;
        } else {
          const sourceInstanceId = data.AutoScalingGroups[0].Instances[0];
          const date = new Date();
          const timeStampString = getTimeStampString(date);
          const launchConfigName = `LC ${event.newAmiID} ${timeStampString}`;
          const newLaunchConfig = {
            InstanceId: sourceInstanceId,
            LaunchConfigurationName: launchConfigName,
            ImageId: event.newAmiID
          };
          client.createLaunchConfiguration(newLaunchConfig, (err, data) => {
            if (err) {
              console.log(err);
            } else {
              const asgParams = {
                AutoScalingGroupName: event.targetASG,
                LaunchConfigurationName: newLaunchConfig.LaunchConfigurationName
              };
              client.updateAutoScalingGroup(asgParams);
              return `Updated ASG ${
                event.targetASG
              } with new launch configuration ${
                newLaunchConfig.LaunchConfigurationName
              } which includes AMI ${event.newAmiID}`;
            }
          });
        }
      }
    }
  );
};
