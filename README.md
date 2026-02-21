<p align="center">
  <img src="./img.png" alt="Project Banner" width="100%">
</p>

# [MemoryNest] 🎯

## Basic Details

### Team Name: [Shecodes]

### Team Members
- Member 1: [Nanditha M R] - [SNM INSTITUTE OF MANAGMENT AND TECHNOLOGIES]
- Member 2: [Anusree A] - [SNM INSTITUTE OF MANAGMENT AND TECHNOLOGIES]

### Hosted Project Link
[https://memorynest.vercel.app/]

### Project Description
[MemoryNest is a shared digital diary platform that helps long-distance users maintain emotional connections through shared memories and real-time syncing. It allows paired users to write entries, tag moods, and view a common timeline. The smart “Remember This?” feature resurfaces meaningful past memories based on emotional and inactivity triggers.]

### The Problem statement
[Long-distance users struggle to maintain emotional connection due to limited shared experiences and lack of meaningful memory reminders. Important moments are often forgotten without an intelligent system to document and resurface them.]

### The Solution
[MemoryNest provides a shared digital diary where long-distance users can store memories, tag emotions, and view a synchronized timeline. Its smart “Remember This?” feature automatically resurfaces meaningful past memories based on inactivity, mood changes, and date-based triggers to strengthen emotional connection.]

---

## Technical Details

### Technologies/Components Used

**For Software:**
- Languages used: [CSS,JAVASCRIPT,HTML]
- Frameworks used: []
- Libraries used: []
- Tools used: [ Antigravity, supabase ]

---

## Features

List the key features of your project:
- Feature 1: [Two (or multiple) users share one private digital diary]
- Feature 2: [Only invited members can view or write]
- Feature 3: [Secure authentication (Supabase Auth)]
- Feature 4: [Real-time syncing]

---

## Implementation

### For Software:

#### Installation
```bash
[npm install]
```

#### Run
```bash
[Run commands - e.g., npm start, python app.py]
```


---

## Project Documentation

### For Software:

#### Screenshots (Add at least 3)

![Screenshot1](<img width="1917" height="1079" alt="image" src="https://github.com/user-attachments/assets/34976621-b816-4ea8-b820-38d1e9dcc6c1" />
)
*this is the login page of our project*

![Screenshot2](<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/839e7962-795e-431a-8afa-a57210c40689" />

)
*this is the feed page of our project*

![Screenshot3](<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/92fe04c4-eb6c-4693-944b-67bf3ac1aa99" />

)
*this is the page where we can add memories*

#### Diagrams

**System Architecture:**

![Architecture Diagram](<img width="853" height="1280" alt="image" src="https://github.com/user-attachments/assets/fe4e2a75-24ad-489d-a0e3-b9b899efdf04" />
)
*Explain your system architecture - MemoryNest follows a Client–Server architecture with real-time database synchronization and a trigger-based memory engine.
Frontend: Users interact through a web app to add diary entries, select moods, and view memory pop-ups..
Real-Time Sync: Updates both users instantly when new entries are added.
Trigger Engine: Periodically checks conditions like inactivity, same date last year, or mood contrast to resurface memories through smart “Remember This?” pop-ups.*

**Application Workflow:**

![Workflow](docs/workflow.png)
*Add caption explaining your workflow*

---

### For Hardware:

#### Schematic & Circuit

![Circuit](Add your circuit diagram here)
*Add caption explaining connections*

![Schematic](Add your schematic diagram here)
*Add caption explaining the schematic*

#### Build Photos

![Team](Add photo of your team here)

![Components](Add photo of your components here)
*List out all components shown*

![Build](Add photos of build process here)
*Explain the build steps*

![Final](Add photo of final product here)
*Explain the final build*

---

## Additional Documentation

### For Web Projects with Backend:

#### API Documentation

**Base URL:** `https://api.yourproject.com`

##### Endpoints

**GET /api/endpoint**
- **Description:** [What it does]
- **Parameters:**
  - `param1` (string): [Description]
  - `param2` (integer): [Description]
- **Response:**
```json
{
  "status": "success",
  "data": {}
}
```

**POST /api/endpoint**
- **Description:** [What it does]
- **Request Body:**
```json
{
  "field1": "value1",
  "field2": "value2"
}
```
- **Response:**
```json
{
  "status": "success",
  "message": "Operation completed"
}
```

[Add more endpoints as needed...]

---

### For Mobile Apps:

#### App Flow Diagram

![App Flow](docs/app-flow.png)
*Explain the user flow through your application*

#### Installation Guide

**For Android (APK):**
1. Download the APK from [Release Link]
2. Enable "Install from Unknown Sources" in your device settings:
   - Go to Settings > Security
   - Enable "Unknown Sources"
3. Open the downloaded APK file
4. Follow the installation prompts
5. Open the app and enjoy!

**For iOS (IPA) - TestFlight:**
1. Download TestFlight from the App Store
2. Open this TestFlight link: [Your TestFlight Link]
3. Click "Install" or "Accept"
4. Wait for the app to install
5. Open the app from your home screen

**Building from Source:**
```bash
# For Android
flutter build apk
# or
./gradlew assembleDebug

# For iOS
flutter build ios
# or
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

---

### For Hardware Projects:

#### Bill of Materials (BOM)

| Component | Quantity | Specifications | Price | Link/Source |
|-----------|----------|----------------|-------|-------------|
| Arduino Uno | 1 | ATmega328P, 16MHz | ₹450 | [Link] |
| LED | 5 | Red, 5mm, 20mA | ₹5 each | [Link] |
| Resistor | 5 | 220Ω, 1/4W | ₹1 each | [Link] |
| Breadboard | 1 | 830 points | ₹100 | [Link] |
| Jumper Wires | 20 | Male-to-Male | ₹50 | [Link] |
| [Add more...] | | | | |

**Total Estimated Cost:** ₹[Amount]

#### Assembly Instructions

**Step 1: Prepare Components**
1. Gather all components listed in the BOM
2. Check component specifications
3. Prepare your workspace
![Step 1](images/assembly-step1.jpg)
*Caption: All components laid out*

**Step 2: Build the Power Supply**
1. Connect the power rails on the breadboard
2. Connect Arduino 5V to breadboard positive rail
3. Connect Arduino GND to breadboard negative rail
![Step 2](images/assembly-step2.jpg)
*Caption: Power connections completed*

**Step 3: Add Components**
1. Place LEDs on breadboard
2. Connect resistors in series with LEDs
3. Connect LED cathodes to GND
4. Connect LED anodes to Arduino digital pins (2-6)
![Step 3](images/assembly-step3.jpg)
*Caption: LED circuit assembled*

**Step 4: [Continue for all steps...]**

**Final Assembly:**
![Final Build](images/final-build.jpg)
*Caption: Completed project ready for testing*

---

### For Scripts/CLI Tools:

#### Command Reference

**Basic Usage:**
```bash
python script.py [options] [arguments]
```

**Available Commands:**
- `command1 [args]` - Description of what command1 does
- `command2 [args]` - Description of what command2 does
- `command3 [args]` - Description of what command3 does

**Options:**
- `-h, --help` - Show help message and exit
- `-v, --verbose` - Enable verbose output
- `-o, --output FILE` - Specify output file path
- `-c, --config FILE` - Specify configuration file
- `--version` - Show version information

**Examples:**

```bash
# Example 1: Basic usage
python script.py input.txt

# Example 2: With verbose output
python script.py -v input.txt

# Example 3: Specify output file
python script.py -o output.txt input.txt

# Example 4: Using configuration
python script.py -c config.json --verbose input.txt
```

#### Demo Output

**Example 1: Basic Processing**

**Input:**
```
This is a sample input file
with multiple lines of text
for demonstration purposes
```

**Command:**
```bash
python script.py sample.txt
```

**Output:**
```
Processing: sample.txt
Lines processed: 3
Characters counted: 86
Status: Success
Output saved to: output.txt
```

**Example 2: Advanced Usage**

**Input:**
```json
{
  "name": "test",
  "value": 123
}
```

**Command:**
```bash
python script.py -v --format json data.json
```

**Output:**
```
[VERBOSE] Loading configuration...
[VERBOSE] Parsing JSON input...
[VERBOSE] Processing data...
{
  "status": "success",
  "processed": true,
  "result": {
    "name": "test",
    "value": 123,
    "timestamp": "2024-02-07T10:30:00"
  }
}
[VERBOSE] Operation completed in 0.23s
```

---

## Project Demo

### Video
[Add your demo video link here - YouTube, Google Drive, etc.]

*Explain what the video demonstrates - key features, user flow, technical highlights*

### Additional Demos
[Add any extra demo materials/links - Live site, APK download, online demo, etc.]

---

## AI Tools Used (Optional - For Transparency Bonus)

If you used AI tools during development, document them here for transparency:

**Tool Used:** [e.g., GitHub Copilot, v0.dev, Cursor, ChatGPT, Claude]

**Purpose:** [What you used it for]
- Example: "Generated boilerplate React components"
- Example: "Debugging assistance for async functions"
- Example: "Code review and optimization suggestions"

**Key Prompts Used:**
- "Create a REST API endpoint for user authentication"
- "Debug this async function that's causing race conditions"
- "Optimize this database query for better performance"

**Percentage of AI-generated code:** [Approximately X%]

**Human Contributions:**
- Architecture design and planning
- Custom business logic implementation
- Integration and testing
- UI/UX design decisions

*Note: Proper documentation of AI usage demonstrates transparency and earns bonus points in evaluation!*

---

## Team Contributions

- [Name 1]: [Specific contributions - e.g., Frontend development, API integration, etc.]
- [Name 2]: [Specific contributions - e.g., Backend development, Database design, etc.]
- [Name 3]: [Specific contributions - e.g., UI/UX design, Testing, Documentation, etc.]

---

## License

This project is licensed under the [LICENSE_NAME] License - see the [LICENSE](LICENSE) file for details.

**Common License Options:**
- MIT License (Permissive, widely used)
- Apache 2.0 (Permissive with patent grant)
- GPL v3 (Copyleft, requires derivative works to be open source)

---

Made with ❤️ at TinkerHub
