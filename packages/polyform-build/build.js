//build phase looks at each environment and generates any necessary files
//it would be nice if the state of the config was reflected
// such that npm|yarn install would invoke this if the config has changed
// use a local git URL for this?
// this way avoids an additional step for building and running an app
// and logically make sense to group together
// (since rebase components are just like packages)

/*
function isOutOfDate(): boolean {
  * packages changed
  * local files changed
}
*/

/*
for each environment {
 write out files
 generate run.js
}
generate install.js for install stage
generate run.js for run stage
*/
