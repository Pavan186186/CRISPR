General Overview
The course project will take up most of the semester, and will require you to showcase technical proficiency in web and D3 programming as well as the ability to effectively communicate data insights using visualization design concepts and theory from the course lectures and readings. The course project requires hands-on software engineering that is typical of application development and design studies in visualization research, including data cleaning/wrangling, feature and interface design, prototyping, and implementation of a full-stack web application.

There are three types of projects available for CSE 578:

Dual Visual Data Story
Mentored Projects
MS thesis/Ph.D. Student-Led Project
See the Project Types page for full descriptions.

Some things to keep in mind:

Most students will do dual visual data story projects. For this project type, team size is 6 students (3 per side). MS/PhD-led projects can be less (between 1-6 students), and mentored projects have individualized team sizes.
The project is worth a significant portion of your overall grade and will take most of the semester to complete. 
There are several deliverables. Manage your time well so you can complete all of them.
Your interface and visualization must use D3.v7. Similar to homeworks, your project should by run via the VS Code Live Server plugin or as an npm package (e.g., via an npm start type of command).
If you want to use React, that is allowed. You'll need to use the D3-React library instead of the 'vanilla' D3 library.
Your team must do their own implementation. Do not use someone else's code (e.g., the charts from an online/existing data story).
Final project deliverables will include the following:

Poster: The last week of class, your project will be demoed via a poster. We will have two poster sessions during lecture time and your team will present at one of these. (You should also expect to attend both poster sessions.)
Code: Your project's codebase will be stored in a GitHub repository on the course's GitHub organization.
Documentation: In your codebase's root folder, include a readme.md markdown file (reviewable in GitHub) that describes how to run the your story application/website.
Team Report: A short report describing your project.
Personal Reflection Reports: Each team member will submit their own 3-page report describing their personal involvement in the course project. This report may optionally be used for your MCS portfolios (in fact, the personal reflection report is exactly a project report for this class), and so should be formatted/styled like your prior MCS reports (if you already have some). See the Personal Reflections Report page for details on this part of the project.
Team Evaluations: Part of your grade is based on your teammates' impressions of your work on the project. All team members are expected to output a similar amount of work on the project.
Project steps:
(1) Form a team and select a project
Form a team of students; I suggest using Slack for this. A #team-formation channel has been created specially for project networking.
Review the details about the project types and select one.
Send a Slack group message to Dr. Bryan and the TA with the following info in this format:
Team member #1, their email
Team member #2, their email
...
Team member #6, their email
If you have a name for your project (e.g., "A Visual Data Story about XYZ"), you can send that too. Otherwise, once you finalize a project title, send us a follow up message.
(2) Project Proposals
Write a 2–4 page project proposal describing the story you are planning to tell. Structure it around the following:

Title + team members
Briefly summarize the topic/story you plan to focus on
Discuss the dataset(s) you intend to use for your project. (It's okay if you don't have all the dataset(s) identified at this point; we just want to know you're able to find data in this area.)
For at least one dataset, you must perform a data abstraction (if the dataset contains many attributes, just pick 5-6 of interest).
Be sure that your abstraction includes both a colloquial description of the data and generic/abstract labels.
At a high level, outline some of the idioms (visualizations and interactions) you expect you'll implement for the story. If desired, you can include a mockup figure outlining what you expect to implement (a pen and paper sketch is fine for this, as long as it is legible).
This report will be submitted on Canvas as a PDF.

(3) Project Sketches
You will submit a sketch outlining the design of your project. This can be done as a hand-drawn figure, as a five design sheets, as a set of Figma/Photoshop/Tableau images, etc.

The sketch should include mock ups of all the intended visualizations that you intend to implement in your project.
It should also indicate/label the interactions that a user can perform with the project. 
E.g., for a scrollytelling story, scrolling would be an interaction, but different media are also triggered based on this scrolling. You need to note these, and also what interactions will be shown on the screen!
Another interaction might be hovering or clicking on a visualization. The sketch should indicate the interaction that a user can perform, and illustrate (or describe) the resultant action.
As with the project proposal, it is okay if your final project changes from what is proposed/sketched! Lots of teams find unexpected insights, or encounter difficulties along the way. The final project is graded based on what you submit, not how similar it is to the sketch.

By this point in the project, I would also recommend that you use some visualization tool (D3 could work, but you might also consider using tools like Tableau (free for students!Links to an external site.), PowerBI, ggplot, etc. to create some mockup charts and do initial explorations of the data. This will serve both as a sanity check, but can also help you figure out how to compose your final charts (e.g., should there be filtering? should they be 'zoomed in'? do we need to change the visualization technique to better support our story?).

(3) Implement the System
A GitHub repository will be created for your project, accessible by your team. As you implement your project, use this repository to store the codebase.

Note: Do NOT upload raw datasets if they are large (>20 MB), as this will fill up our Github organization's space. Also do not use GitHub's LFS. Instead, if your dataset is large, in your readme.md file, detail where/how to download the data and where to place it in your local system's folders so that your project runs correctly. If you have pre-processed data and this derived data is not large, that processed dataset can be safely uploaded to GitHub.

Note: You should do your own work and development. Students have failed CSE 578 before because they took (all or part of) an original story and submitted it as their course project. We check submitted code against online repos for plagiarism. If you have questions about what is allowed and what constitutes "plagiarism," check with Dr. Bryan.