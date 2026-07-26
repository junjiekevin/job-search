List jobs
{
  "jobs": [
    {
      "id":127817,
      "internal_job_id":144381,
      "title":"Vault Designer",
      "updated_at":"2016-01-14T10:55:28-05:00",
      "requisition_id": "50",
      "location":{
        "name":"NYC"
      },
      "absolute_url":"https://boards.greenhouse.io/vaulttec/jobs/127817",
      "language":"en",
      "metadata":null
    }
  ],
  "meta": {
    "total": 1
  }
}
When ?content=true:

{
  "jobs": [
    {
      "id":127817,
      "internal_job_id":144381,
      "title":"Vault Designer",
      "updated_at":"2016-01-14T10:55:28-05:00",
      "requisition_id": "50",
      "location":{
        "name":"NYC"
      },
      "absolute_url":"https://boards.greenhouse.io/vaulttec/jobs/127817",
      "language":"en",
      "metadata":null,
      "content":"This is the job description. &amp;lt;p&amp;gt;Any HTML included through the hosted job application editor will be automatically converted into corresponding HTML entities.&amp;lt;/p&amp;gt;",
      "departments":[
        {
          "id":13583,
          "name":"Department of Departments",
          "parent_id":null,
          "child_ids":[
            13585
          ]
        }
      ],
      "offices":[
        {
          "id":8304,
          "name":"East Coast",
          "location":"United States",
          "parent_id":null,
          "child_ids":[
            8787
          ]
        },
        {
          "id":8787,
          "name":"New York City",
          "location":"New York, NY, United States",
          "parent_id":8304,
          "child_ids":[
          ]
        }
      ]
    }
  ],
  "meta": {
    "total": 1
  }
}
Returns the list of all job posts. The id field contains the unique identifier for the job post, while internal_job_id contains the unique identifier for the job itself. Any job custom fields you have selected to be exposed in the job board API will be shown in the metadata attribute.

 When submitting a job application, you will use the id field to specify the application's target job post.
Prospect posts include a null value for internal_job_id

HTTP Request
GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs

URL Parameters
Parameter	Description
board_token	Job Board URL token
Optional Querystring Parameters
Parameter	Description
content	If set to true, include the full post description, department, and office of each job post.