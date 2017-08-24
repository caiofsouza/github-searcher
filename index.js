const chalk = require('chalk')
const clear = require('clear')
const inquirer = require('inquirer')
const GitHubApi = require('github')
const git = require('simple-git')()
const fs = require('fs')
const files = require('./libs/file')
const figlet = require('figlet')

const { exec } = require('child_process')

const github = new GitHubApi({
  version: '3.0.0'
})

clear()
console.log(
  chalk.blue(
    figlet.textSync('GitHub Finder', { horizontalLayout: 'full' })
  )
)


const getGithubRepo = (callback) => {
  var questions = [
    {
      name: 'repo_name',
      type: 'input',
      message: 'Search a GitHub repository'
    }
  ]

  inquirer.prompt(questions).then(callback);
}

getGithubRepo((params) => {
  const { repo_name } = params

  console.log(chalk.blue('Searching repositories...'))

  github.search.repos({
    q: repo_name
  }, function(err, res) {
    const repoFullNames = res.data.items.map(repo => {
      return repo.full_name
    })

    inquirer.prompt(
      [
        {
          type: 'list',
          name: 'selected',
          message: 'Select the repository that you want to clone?',
          choices: repoFullNames,
          default: ['node_modules', 'bower_components']
        }
      ]
    ).then(function( answers ) {
      const { selected } = answers
      console.log(selected)

      exec('echo ""', (err, stdout, stderr) => {
        if (err) {
          // node couldn't execute the command
          return;
        }

        // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      })

      process.exit()
    })
  })
  
})


