Jobs - Search - Parameter
This API runs a search of all the jobs on the reed site and returns a list of jobs which match the parameters.

Criteria Name	Possible Values
employerId	id of employer posting job
employerProfileId	profile id of employer posting job
keywords	any search keywords
locationName	the location of the job
distanceFromLocation	distance from location name in miles (default is 10)
permanent	true/false
contract	true/false
temp	true/false
partTime	true/false
fullTime	true/false
minimumSalary	lowest possible salary e.g. 20000
maximumSalary	highest possible salary e.g. 30000
postedByRecruitmentAgency	true/false
postedByDirectEmployer	true/false
graduate	true/false
resultsToTake	maximum number of results to return (defaults and is limited to 100 results)
resultsToSkip	number of results to skip (this can be used with resultsToTake for paging)
Notes:
Only one of employerId and employerProfileId can be set. Profile Id will be selected over Employer Id. Not all employers have a profile and therefore do not have a profile id.

Jobs - Search - Returns
List of jobs matching the criteria. Each job contains the following information:

Job IdEmployer IdEmployer NameEmployer Profile IdJob TitleDescriptionLocation NameMinimum SalaryMaximum Salary
Notes:
If the job salary has been set as hidden on reed.co.uk, none of the salary information will show.

If a location is used which could apply to more than one place the best match is used for the search and a list of alternatives is provided.

Jobs - Search - Implementation
Use the following url structure to access the API::

https://www.reed.co.uk/api/{versionnumber}/search?keywords={keywords}&loc ationName={locationName}&employerId={employerId}&distanceFromLocation={distance in miles}
Follow this structure for each parameter you wish to search with.

If you do not want to use any of these parameters simply leave them out. e.g

https://www.reed.co.uk/api/1.0/search?keywords=accountant&location=london&employerid=123&distancefromlocation=15
If no jobs match the search parameters an empty list will be returned. If there is more than one location match, these will also be returned.

Important:
You will need to include your api key for all requests in a basic authentication http header as the username, leaving the password empty.

Jobs - Details - Parameter
This API requires the id of the job.

Jobs - Details - Returns
The details of the requested job. Each job contains the following information:

Employer IdEmployer NameJob TitleJob DescriptionLocation NameMinimum SalaryMaximum SalaryYearly Minimum SalaryYearly Maximum SalaryCurrencySalary Type (per hour, per day, per week, per month, per annum)ContractType (permanent, contract, temporary)Job Type (Full Time/Part Time)Expiration DateExternal Url (for jobs with the application on an external site)Url to job on reed.co.uk
Notes:
If the job salary has been set as hidden on reed.co.uk, none of the salary information will show.

Jobs - Details - Implementation
Use the following url to access this API:

https://www.reed.co.uk/api/{version number}/jobs/{Job Id} e.g. https://www.reed.co.uk/api/1.0/jobs/132
If no jobs match a blank job will be returned.

Important:
You will need to include your api key for all requests in a basic authentication http header as the username, leaving the password empty.