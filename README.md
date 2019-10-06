# Nica Destinos
Google action for Global Voice Hackathon 2019 in Nicaragua.

This is a voice app for your Google Assistant that shows you the cool places to visit in Nicaragua, its amusments and different activities you can do while you're traveling to our country and even for locals who want to have fun or go on vacation :)

 ## Quick start
 
 If you want to test this project out, follow these steps:
 
 1. Create a new Dialogflow agent with your Google account.
 2. Go to your agent settings, within “Export and Import” click **IMPORT FROM ZIP** button and upload the `agent/NicaDestinos.zip` file located in the project.
 3. In the Dialogflow console go to Integrations, select Google Assistant and hit Test. It’ll take you to Actions on Google console, run the simulator within the Test section and you’re ready to go.
 
 ## Project setup
 
 This project uses a Dialogflow agent, a webhook using [Actions on Google JavaScript SDK](https://developers.google.com/actions/sdk) hosted on Cloud Functions for Firebase platform and Firestore as a storage solution.
 
By default when you import the agent it will communicate with a configured and running webhook but if you want to deploy this code to your own Google Could project remember using [Firebase CLI](https://firebase.google.com/docs/cli) and run the commands: ```firebase login``` and ```firebase init```
 
 ## Action scope
 
Nicaragua is distributed among 15 departments (cities) and 2 autonomous regions, so when you use the action the first thing it'll ask is about which department (city) you're intrested in visiting, then it'll tell you a bit about your selection and the activities you can do in there, when you tell the activity you'd like to do, the action will list you places where you can do that; let's say you'd like to visit Matagalpa (a city/department of Nicaragua) and you're intested in hiking, so the action will also tell you the avilable places where you can perform hiking, as well as how you can get there from the center of the city, which transportation mean is appropriate to go in and other relevant facts or clues to get you safe and comfortable. So the action might recommend you to bring mosquito repellent if your target is a forest or anywhere with moisture. Another recommendations that the action might tell you, could be the appropriate clothes or shoes and anything necessary that you should bare in mind.

These are the possible utterances that that action will understand:


| Spanish Utterance | Result |
|-------------|:-------------|
| *Hablar a Nica Destinos*        | It'll greet you and ask you to select a **department** in Nicaragua as destination    |
| *Me gustaria ir a Matagalpa*    | It'll talk a bit about **Matagalpa** and lists you the activities available in there  |
| *Quiero hacer senderismo*       | It'll tell you the places in **Matagalpa** to go hiking                               |
| *Me gustaria ir a Selva Negra*  | It'll tell how to get to **Selva Negra** in **Matagalpa**                             |
| *Quiero hacer canopy en Granada*| It'll tell you the places in **Granada** to go canopying                              |
| *Ayuda*                         | It'll bring you some suggestions about things the action can do                      |

As the conversation goes on, the action will help you and ask you if you're intrested in know more about the city your first select or another destination in Nicaragua.

 ### TODO
 
Internationalization is a MUST for this voice app, we know not all tourists speak Spanish, so we want the action to be bilingual. We promise to implement it :sweat_smile: just wait for it.
 
 
 ### Final words

And last but not the least, special thanks to the whole team that collaborated with this project and made this possible. 

Thank you guys: @tad1693, @amelara and @mxaguilera.
 

