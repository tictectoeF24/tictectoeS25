# TicTecToe

## Name

TicTecToe

## Description

TicTecToe is a social media platform designed specifically for researchers to discover, consume, and engage with research papers more efficiently. It addresses common pain points in research, such as information overload, limited time, and scattered sources of papers. The platform aims to create a central hub for researchers to streamline these activities and foster collaboration.

## Installation

Installation instructions available [here](https://dalu.sharepoint.com/:b:/r/teams/TicTecToe2024F/Shared%20Documents/General%20-%20Client%20facing/Guidelines%20for%20development/Coding%20Guidelines%20for%20Developers.pdf?csf=1&web=1&e=qeAfgX)

## Team Links

- [Microsoft Teams](https://teams.microsoft.com/l/channel/19%3A0b58ec520c444adaa028007ab2f71fe2%40thread.tacv2/TicTecToe%20-%20Usmi?groupId=a4f35439-36c6-463b-ac7b-60f7ca6d3aab&tenantId=60b81999-0b7f-412d-92a3-e17d8ae9e3e0) - Primary communication platform
- [GitLab](https://git.cs.dal.ca/courses/csci-x691/tictectoe) - Task/ticket management, code repository, and CI/CD
- [RFP](https://dal.brightspace.com/d2l/le/content/344719/viewContent/4452038/View)
- [x691 Teams Channel](https://teams.microsoft.com/l/channel/19%3A0b58ec520c444adaa028007ab2f71fe2%40thread.tacv2/TicTecToe%20-%20Usmi?groupId=a4f35439-36c6-463b-ac7b-60f7ca6d3aab&tenantId=60b81999-0b7f-412d-92a3-e17d8ae9e3e0)

## Task and Project Management

All task management, issue tracking, and project coordination is handled through **GitLab Issues** and **Microsoft Teams**. 
- Create tasks and track issues using GitLab Issues
- Use GitLab Merge Requests for code reviews and integration
- Coordinate and communicate via Microsoft Teams

## Task and Project Management

All task management, issue tracking, and project coordination is handled through **GitLab Issues** and **Microsoft Teams**. 
- Create tasks and track issues using GitLab Issues
- Use GitLab Merge Requests for code reviews and integration
- Coordinate and communicate via Microsoft Teams

## Branch Creation

1. For consistent branch naming, use the format: <functionality>-<lastname>. For example, if you're creating a branch to work on a login button feature and your last name is Nykl, the branch name would be: login-button-nykl
2. All developers should create merge requests (MRs) in GitLab to merge changes into the development branch. At the end of each major sprint, senior developers will merge development into main.

### main

- The main branch represents the stable, production-ready version of the project. It is where final, thoroughly tested, and approved code is merged.
- This branch should always be functional and deployable. Any issues in this branch could affect the live application or production environment.

### Development

- The development branch is where active development happens. This branch serves as the integration point for all features, bug fixes, and updates during the software development process.
- New features, improvements, and bug fixes are developed in feature branches (often named after the functionality being developed) and merged into the development branch.

## Project structure

### tictectoe-frontend

this is where all of our frontend pages for both mobile and webpage will be held.

tictectoe-frontend\updateIp.js
- Dynamically updates the base URL to use the local IP address

tictectoe-frontend\config.js
- Defines a constant with the base URL

tictectoe-frontend\api.js
- Defines async functions for making API requests

tictectoe-frontend\App.js
- Defines mobile navigation using Stack Navigator

tictectoe-frontend\App.web.js
- Defines desktop navigation
- Sets up unique routes for each paper

tictectoe-frontend\src\components
- All pages are found here
- Desktop pages end with .web.js
- Mobile pages end just with .js

tictectoe-frontend\src\components\small-components
- Smaller components are found here

tictectoe-frontend\src\components\functions
- Contains utility function definitions
- Functions can be imported on other frontend files as needed 

tictectoe-frontend\src\contexts
- All context files are found here
- Desktop context end with .web.js
- Mobile context end just with .js

tictectoe-frontend\src\styles
- All styles are created with the React Native StyleSheet API
- Desktop Styles end with .web.js
- Mobile Styles end just with .js

tictectoe-frontend\assets
- Assests such as images are to be included here

### tictectoe-backend

this is where all of our backend development will take place.

#### tictectoe-backend\app.js
- Initializes middleware, mounts route modules, and exposes health + PDF proxy endpoints.

#### tictectoe-backend\controllers
- `authController.js`: Handles signup, login, OTP, password reset, and email validation.
- `paperController.js`: Manages paper ingestion, recommendations, social interactions, audio pipeline, newsletter, and transcript APIs.
- `profileController.js`: Handles profile updates, interests, ORCID linking, and authorship claims.
- `conversationController.js`: Provides chat persistence APIs.
- `noteController.js`: Manages note persistence APIs.
- `followController.js`: Handles follow graph APIs.
- `searchController.js`: Implements user search functionality.
- `utilitiesController.js`: Provides utilities like PDF text extraction and category management.

#### tictectoe-backend\routes
- Defines REST API endpoints grouped by domain.

#### tictectoe-backend\middleware
- `authenticate.js`: Validates Bearer JWT tokens and enriches `req.user`.

#### tictectoe-backend\scripts
- Utility scripts for data preprocessing and operations.
- `generateProcessedJson.js`: Generates processed section JSON for a given DOI.
- `ensureLatexContentForPaper.js`: Ensures `latex_content` exists for a given DOI.

#### tictectoe-backend\tests
- Includes unit and integration tests for controllers, middleware, and routes.

#### tictectoe-backend\sql
- Contains schema helper SQL for chat persistence models.

#### tictectoe-backend\python-scripts
- Local Python utilities for tasks like TTS generation.

#### tictectoe-backend\ffmpeg
- Bundled ffmpeg binary used for audio segmentation.

## Additional Documentation

For detailed information about the project architecture, API documentation, deployment procedures, and comprehensive development guidelines, please refer to the closing documentation and project documentation available in the GitLab repository and Microsoft Teams shared documents.

## Authors and acknowledgment

### Winter 2026 Team:

**Development Director:**
- Sahil Tanna (sahil@dal.ca)

**Technical Director:**
- Camilo Sanchez Porras (camilo.sanchez@dal.ca)
- Abdulsamad Hussain (a.hussain@dal.ca)

**Senior Developers:**
- Faisal Abujamous (fs807825@dal.ca)
- Cole LeBlanc (cl797917@dal.ca)

**Junior Developers:**
- Ranem Al-Masalmeh (rn675467@dal.ca)
- Minh Son Truong (mn581343@dal.ca)
- Sahil Chowdary Ganta(sh814514@dal.ca)
- Darshil Nedunuri (dr671676@dal.ca)



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