# kaabo

Kaabo is a *work in progress* side-project. The repo currently only contains the back-end for the project and is not yet ready for real-world use.

The project consists of 3 pillars: this back-end, a react front-end and a contentful.com space with the data.
The react-front-end is shown on a kiosk-device, which fetches the content from the contentful cms.

When a client enters the building they are presented a list of companies, they can then filter the companies and
find an employee to contact. This contact request is routed via the NodeJs back-end which sends a Facebook Messenger message to the employee and presents them with a set of buttons to indicate how long the client will have to wait. 
