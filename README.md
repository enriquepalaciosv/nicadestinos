# Nica Destinos
Google action for Global Voice Hackathon 2019 in Nicaragua.

This is a voice app for your Google Assistant that shows you the cool places to visit in Nicaragua, its amusements and different activities you can do while you're traveling to our country and even for locals who want to have fun or go on vacation :)

 ## Quick start
 
 If you want to test this project out, follow these steps:
 
 1. Create a new Dialogflow agent with your Google account.
 2. Go to your agent **Settings** ⚙ > **Export and Import** tab > click **IMPORT FROM ZIP** button and upload the `agent/NicaDestinos.zip` file located in the project.
 3. In the Dialogflow console go to **Integrations** > select **Google Assistant** > hit **Test**. It’ll take you to Actions on Google console, run the simulator within the **Test** section and you’re ready to go.
 
 ## Project setup
 
 This project uses a Dialogflow agent, a webhook using [Actions on Google JavaScript SDK](https://developers.google.com/actions/sdk) hosted on Cloud Functions for Firebase platform and Firestore as a storage solution.
 
By default when you import the agent it will communicate with a configured and running webhook but if you want to deploy this code to your own Google Could project remember using [Firebase CLI](https://firebase.google.com/docs/cli).

For more detailed steps and commands to run a Node.js voice app for Google Assistant, please follow [these instructions](https://github.com/actions-on-google/dialogflow-facts-about-google-nodejs).
 
 ## Action scope
 
Nicaragua is distributed among 15 departments (cities) and 2 autonomous regions, so when you use the action the first thing it'll ask is about which department (city) you're intrested in visiting, then it'll tell you a bit about your selection and the activities you can do in there, when you tell the activity you'd like to do, the action will list you places where you can do that; let's say you'd like to visit Matagalpa (a city/department of Nicaragua) and you're intested in hiking, so the action will also tell you the avilable places where you can perform hiking, as well as how you can get there from the center of the city, which transportation mean is appropriate to go in and other relevant facts or clues to get you safe and comfortable. So the action might recommend you to bring mosquito repellent if your target is a forest or anywhere with moisture. Another recommendations that the action might tell you, could be the appropriate clothes or shoes and anything necessary that you should bare in mind.

These are the possible utterances that that action will understand:


|  Utterance | Behavior |
|-------------|:-------------|
| *Talk to Nica Destinos*        | It'll greet you and ask you to select a **department** in Nicaragua as destination    |
| *I'd like to go to Matagalpa*    | It'll talk a bit about **Matagalpa** and lists you the activities available in there  |
| *I want to do hiking*       | It'll tell you the **places/cities** where you can go hiking                               |
| *I would like to go to Selva Negra*  | It'll tell how to get to **Selva Negra** in **Matagalpa**                        |
| *I want canopy in Granada*| It'll tell you the places in **Granada** to go canopying                              |
| *What can I do around me?*| It'll tell you the places to go based on your location                              |
| *Other cities to swim*| It'll give you other destinations to do a selected activity                              |
| *Help*                         | It'll bring you some suggestions about things the action can do                      |

As the conversation goes on, the action will help you and ask you if you're intrested in know more about the city your first select or another destination in Nicaragua.

 
 ### Final words

And last but not the least, special thanks to the whole team that collaborated with this project and made this possible. 

Thank you guys: @tad1693, @amelara and @mxaguilera.
 

