# TicTecToe

## Name

TicTecToe

## Description

TicTecToe is a social media platform designed specifically for researchers to discover, consume, and engage with research papers more efficiently. It addresses common pain points in research, such as information overload, limited time, and scattered sources of papers. The platform aims to create a central hub for researchers to streamline these activities and foster collaboration.

## Installation

Installation instructions available [here](https://dalu.sharepoint.com/:b:/r/teams/TicTecToe2024F/Shared%20Documents/General%20-%20Client%20facing/Guidelines%20for%20development/Coding%20Guidelines%20for%20Developers.pdf?csf=1&web=1&e=qeAfgX)

## Team Links

- [Teams](https://teams.microsoft.com/l/team/19%3Abh6SYdmkXXnYAuRbihLQABobzPJgf3akTjDBM-zkerc1%40thread.tacv2/conversations?groupId=b78d9e3c-1023-41a3-9d97-64e0b30e5c95&tenantId=60b81999-0b7f-412d-92a3-e17d8ae9e3e0)
- [Jira](https://jira.cs.dal.ca/secure/RapidBoard.jspa?rapidView=62&projectKey=TTT#)
- [Confluence](https://confluence.cs.dal.ca/spaces/viewspace.action?key=TTT)
- [RFP](https://dal.brightspace.com/d2l/le/content/344719/viewContent/4452038/View)
- [Gitlab](https://git.cs.dal.ca/courses/csci-x691/tictectoe)
- [x691 Brightspace Fall 24](https://dal.brightspace.com/d2l/home/344719)
- [x691 Teams Channel](https://teams.microsoft.com/l/channel/19%3AYawIhLqDKyYuxhPwFNYgS4IUbkwb2ejFMqKKczevvEA1%40thread.tacv2/General?groupId=e71c0272-3d75-4877-9c6b-ad757d8f2870)

## Branch Creation

1. For consistent branch naming, use the format: <functionality>-<lastname>. For example, if you're creating a branch to work on a login button feature and your last name is Nykl, the branch name would be: login-button-nykl
2. All developers should create pull requests (PRs) to merge changes into the development branch. At the end of each major sprint, senior developers will merge development into main.

### main

- The main branch represents the stable, production-ready version of the project. It is where final, thoroughly tested, and approved code is merged.
- This branch should always be functional and deployable. Any issues in this branch could affect the live application or production environment.

### Development

- The development branch is where active development happens. This branch serves as the integration point for all features, bug fixes, and updates during the software development process.
- New features, improvements, and bug fixes are developed in feature branches (often named after the functionality being developed) and merged into the development branch.

## Project structure

### tictectoe-frontend

this is where all of our frontend pages for both mobile and webpage will be held.

- webpage-frontend directory - this is for all desktop pages. Pages here should end with -webpage suffix. EG. the authentication page would be named authentication-webpage
- mobile-frontend directory - this is for all mobile pages. Pages here should end with -mobile suffix. EG. the authentication page would be named authentication-mobile
- CSS directory - this folder will hold all of our styling pages
- img directory - this will hold all images used in development

### tictectoe-backend

this is where all of our backend development will take place, further breakdown of structure to come.

## Authors and acknowledgment

### Fall 2024 Team:

Madeleine Nykl, md452401@dal.ca, Development Director
Pratham Jain, pr245998@dal.ca, Technical Director
Abhinav Chintalapudi, bl442252@dal.ca, Senior Developer
Ishant Jethi, is649926@dal.ca, Senior Developer
Huy Huynh, hy676099@dal.ca, Junior Developer
Jenil Savaliya, jn569163@dal.ca, Junior Developer
Sahil Tanna, sh711153@dal.ca, Junior Developer
Shruti Chaturvedi, sh652956@dal.ca, Junior Developer
Daniel Flemming, dn426420@dal.ca, Junior Developer

### Winter 2025 Team:

<add team names here>

## Helpful Gitlab resources

Use the built-in continuous integration in GitLab.

- [ ] [Set up project integrations](https://git.cs.dal.ca/courses/csci-x691/tictectoe/-/settings/integrations)
- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)
- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)
- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/ee/gitlab-basics/add-file.html#add-a-file-using-the-command-line) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://git.cs.dal.ca/courses/csci-x691/tictectoe.git
git branch -M main
git push -uf origin main
```
