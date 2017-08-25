#!/usr/bin/env node

const chalk = require('chalk')
const inquirer = require('inquirer')
const GitHubApi = require('github')
const figlet = require('figlet')
const ora = require('ora')
const { spawn } = require('child_process')
const github =  new GitHubApi({
  version: '3.0.0'
})
// unicode of star
const starCode = '\u2605'

console.log(
  chalk.blue(figlet.textSync('GitHub Searcher', { horizontalLayout: 'full' }))
)
// some helpers variables
let currentPage = 1
let currentRepoName = ''
let currentRepoArr = []

/**
 * Show a list to user choose the repository 
 * that him want to clone
 * @param {Object} opts List of repositories finded to user choose 
 */
function showResultsList (opts) {
  inquirer.prompt(
    [
      {
        type: 'list',
        name: 'selected',
        message: 'Select the repository that you want to clone',
        choices: opts
      }
    ]
  ).then(answer => {
    const { selected } = answer
    if (selected === 'next_page') {
      // get the next page
      currentPage += 1
      listRepoCallback(currentRepoName)
    } else {
      // find the selected repo
      const selectedRepo = currentRepoArr.find(repo => { 
        return repo.full_name === selected
      })
      cloneRepository(selectedRepo)
    }
  })
}

/**
 * Clone a repository with a subprocess 
 * @param {Object} repoObj the repository object
 */
function cloneRepository (repoObj) {
  // init the loader spinner
  const spinner = ora('Cloning the repository "' + repoObj.full_name + '"').start()
  const cloneProcess = spawn('git', [ 'clone', repoObj.url])
  cloneProcess.on('close', (status) => {
    if (status === 0) {
      spinner.succeed()
      process.exit()
    } else {
      spinner.fail()
      switch(status) {
        case 128:
          console.log(chalk.red('The repository already exists'))
          break;
      }
      process.exit()
    }
  })
}

/**
 * Callback after the user chose the repository
 * @param {String or Object} params The repository name or the repository object
 */
function listRepoCallback (params) {
  currentRepoName = typeof params === 'string' ? params : params.repo_name
  if (currentRepoName.length <= 2) {
    console.log(chalk.red('Search a repository name with 2 or more characters'))
    process.exit()
  }
  const spinner = ora('Searching repositories...').start()
  github.search.repos({
    q: currentRepoName,
    order: 'desc',
    per_page: 20,
    page: currentPage,
    sort: 'stars'
  }, (err, res) => {
    spinner.stop()
    if (err) {
      console.log(err.toString())
      process.exit()
    }
    if (!res.data.items.length) {
      console.log(chalk.yellow('We couldn’t find any repositories matching "'+currentRepoName+'"'))
      process.exit()
    }
    // map some attributes of repositories
    currentRepoArr = res.data.items.map(repo => {
      return {
        full_name: repo.full_name,
        url: repo.git_url,
        description: ( repo.description !== null ? repo.description : '' ),
        stars: repo.stargazers_count
      }
    })
    // map the repositories
    const repoFullNames = currentRepoArr.map(repo => {
      return {
        name: `${repo.full_name}${ repo.description !== null ? ' - ' + repo.description : '' } (${starCode} ${repo.stars})`,
        value: repo.full_name,
        short: `${repo.full_name} (${starCode} ${repo.stars})`
      }
    })
    // if has 20 results on the github search
    // show a next page option
    if(repoFullNames.length === 20) {
      repoFullNames.push({
        name: '[NEXT PAGE]',
        value: 'next_page'
      })
    }
    showResultsList(repoFullNames)
  })
}
/**
 * Show the prompt for input the repository name
 */
function promptRepoName() {
  const questions = [
    {
      name: 'repo_name',
      type: 'input',
      message: 'Type a GitHub repository name or owner/repository'
    }
  ]
  inquirer.prompt(questions).then(listRepoCallback)
}
// init the client
promptRepoName()


