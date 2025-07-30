# Title 
AI Paper summarization

## Description
This readme file will provide you guidance on how to use the Summarization feature

## Usage
1. Make sure you have python installed. Create python virtual environment folder (venv) by navigating into summarization folder in the terminal and typing command "python -m venv venv".
2. Activate the virtual environment with the command "source venv/bin/activate". 
3. install the required packages from the file "requirements.txt". You can do this through command "pip install -r requirements.txt"
 Run the Main.py with the command "python Main.py" in the terminal
4. Go to http://127.0.0.1:5000/
5. You will see 2 options. 
    a. Summarize all papers, and 
    b. summarize an individual paper using the "paper ID" found in supabase.
6. when you click on summarize all the papers, your computer will fetch the papers which don't have AI generated summary and will start processing them one by one. After processing each paper, it will upload the generated summary back into  the database and move onto the next paper to summarize. Any time you want to stop processing, you can always type "ctrl+c". Same goes the summarizing using paper_id. The only difference is that it will fetch and summarize only that paper.

## Contact
Name: Ram Tejesh Reddy Maddi
email: ramtejesh@dal.ca


