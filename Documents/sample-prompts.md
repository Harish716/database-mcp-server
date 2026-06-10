# AETHON Sample Prompts

Use these prompts in the AI Command Center to interact with the database using natural language. 

## Read Operations (Safe)
1. "Show me a list of all tables in the database."
2. "What are the columns in the employees table?"
3. "List all employees."
4. "How many employees work in the Engineering department?"
5. "Show me the attendance records for today."
6. "Who was absent yesterday?"
7. "List all active employees hired in the last 2 years."
8. "What is the total number of reward points issued company-wide?"
9. "Show me the top 5 employees with the most reward points."
10. "Are there any company-wide announcements active right now?"
11. "Show me all managers across all departments."
12. "List all employees whose names start with 'A'."
13. "Find employees who have never received a reward."
14. "Show me the attendance records for John Smith."
15. "What are the different department names?"

## Analysis Queries (Safe)
16. "What is the average number of reward points per employee?"
17. "Which department has the most employees?"
18. "Compare the attendance rates between the Sales and Marketing departments."
19. "Show a breakdown of employee designations by department."
20. "Identify employees who have been late more than 3 times this week."

## Insert Operations (Requires Confirmation)
21. "Add a new department called 'Innovation' with no head yet."
22. "Create a new employee record for 'Alice Wonderland', email alice.w@aethon.local, in the Marketing department as a 'Designer'."
23. "Give 50 reward points to employee ID 5 for 'Excellent project delivery'."
24. "Create a company-wide announcement about the upcoming 'Townhall Meeting on Friday'."
25. "Add a present attendance record for today for Alice Wonderland with 8 working hours."

## Update Operations (Requires Confirmation)
26. "Update the phone number for employee ID 10 to '+1-555-9999'."
27. "Change the designation of all 'Software Engineers' to 'Senior Software Engineer'." *(High Risk)*
28. "Set the status of the 'Townhall Meeting' announcement to expired."
29. "Change the department of employee ID 12 to the Sales department."
30. "Update the check_out time for yesterday's attendance record of employee ID 5 to '18:00'."
31. "Mark all 'ABSENT' records for today as 'HALF_DAY'." *(Medium Risk)*
32. "Increase the reward points by 10 for everyone in the Engineering department."
33. "Disable the account for user ID 8 by setting status to 'INACTIVE'."
34. "Update the description of the Human Resources department to 'People Operations'."

## Delete Operations (Requires Confirmation)
35. "Delete the announcement about the Townhall Meeting."
36. "Remove the reward record with ID 5."
37. "Delete employee ID 49." *(Critical Risk)*
38. "Delete all attendance records from last year." *(Critical Risk)*
39. "Delete the 'Innovation' department."
40. "Remove all users who are inactive."

## Conversational / Memory Queries
41. "Find all employees in the Finance department."
42. *(Follow-up)* "Give them 20 reward points each for closing the quarter successfully."
43. "Show me the details for the user 'admin@aethon.local'."
44. *(Follow-up)* "What is their employee code?"
45. "List employees who were absent today."
46. *(Follow-up)* "Send them an announcement saying 'Please submit your leave requests'."
47. "Show me the last 5 audit logs."
48. *(Follow-up)* "Only show the ones with CRITICAL risk level."
49. "Who is the head of the Engineering department?"
50. *(Follow-up)* "How many people report to them?"
