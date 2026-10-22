# Purdue CS 18000: Midterm 2 Advanced Practice Exam Suite (Harder Edge Cases Edition)

**Target Course:** CS 18000 — Problem Solving and Object-Oriented Programming in Java  
**Exam Duration:** 60 Minutes per exam | **Total Points:** 100 Points per exam  
**Coverage:** Weeks 5–7 (Classes, Static Variables & Counter Mechanics, Encapsulation, Constructor & Method Overloading, Object Composition, Interfaces & Polymorphic Dispatch, Exception Handling & Robust Input Loops, File I/O & Formatting, Inheritance & `super`, `instanceof` & Downcasting)  

---

# Table of Contents
1. [Practice Exam 1](#practice-exam-1)
2. [Practice Exam 2](#practice-exam-2)
3. [Practice Exam 3](#practice-exam-3)
4. [Practice Exam 4](#practice-exam-4)

---

# Practice Exam 1

## Q1: Hello File (6 Points) - *File I/O*
Write a program that creates `hello.txt` holding exactly these three lines:

```
Hello, file!
This is BoilerCS.
Goodbye.
```

Each line ends with a line break (`\n`), including the last. If `hello.txt` already exists, the program replaces its contents completely (do not append). The program prints nothing to the screen (`System.out` and `System.err` must remain completely silent). `Main.java` holds an empty `main`; the whole program is yours to write.

### Sample
After the program runs, `hello.txt` holds the three lines above and nothing else.

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** File `hello.txt` created with exact 3 lines and terminal newline.
* **Test 2 [Hidden] (Overwrite Verification):** If `hello.txt` already existed and contained 1,000 lines of old text, the new file must be truncated to exactly 3 lines with zero remnant bytes.
* **Test 3 [Hidden] (Strict Linebreak Encoding):** Validates that all lines end with standard newline (`\n`) and contains no carriage return (`\r\n`) artifacts or trailing space padding on `"Goodbye."`.
* **Test 4 [Hidden] (Silence Check):** Output streams must emit 0 bytes; accidentally printing status or error messages fails this test.
* **Test 5 [Hidden] (Flush Guarantee):** File handles must be closed properly (try-with-resources); unclosed streams that delay flushing before grader inspection will fail.

---

## Q2: Spacecraft (8 Points) - *Classes & Static Fields*
Implement the class `Spacecraft` in `Spacecraft.java`; the starter file holds method signatures only. All fields must be private.

* A spacecraft knows its callsign (a `String`) and its thrust in kilonewtons (a `double`).
* `Spacecraft(String callsign, double thrust)` stores both and increments the count of spacecraft created.
* `getCallsign()` and `getThrust()` return the fields; `setThrust(double thrust)` changes the thrust.
* `static int getCount()` returns how many `Spacecraft` objects have been created since the program started.
* Calling getters, setters, or passing invalid values does **not** alter `getCount()`.
* `Main.java` is a test driver; do not edit it.

### Sample
```java
Spacecraft s1 = new Spacecraft("Apollo", 45.0);
Spacecraft s2 = new Spacecraft("Artemis", 60.5);
s1.getCallsign();      // -> "Apollo"
s1.getThrust();        // -> 45.0
Spacecraft.getCount(); // -> 2
s1.setThrust(50.0);
s1.getThrust();        // -> 50.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 2 instances created, getters return fields, setter mutates thrust, `getCount()` returns 2.
* **Test 2 [Hidden] (Null Callsign Handling):** `new Spacecraft(null, 10.0)` increments `getCount()` and stores `null` cleanly without `NullPointerException`.
* **Test 3 [Hidden] (Negative Thrust):** Setting thrust to `-5.0` or `0.0` updates the thrust without modifying `getCount()`.
* **Test 4 [Hidden] (Field Encapsulation & Shadowing):** Reflection inspection confirms fields are `private` and non-static, while `count` is `private static`.
* **Test 5 [Hidden] (Static Access Decoupling):** Calling `Spacecraft.getCount()` before any constructor calls returns `0`.
* **Test 6 [Hidden] (Multiple Mutation Stability):** Repeated calls to `setThrust()` on the same instance never affect the static count.

---

## Q3: Thermostat (8 Points) - *Encapsulation & Bounds*
Write the class `Thermostat` in `Thermostat.java`; the file holds signatures only. All fields must be private.

* A thermostat's temperature is an integer level from 50 to 90 degrees Fahrenheit inclusive.
* `setLevel(int level)` stores the value only if it is in range `[50, 90]`; an out-of-range value changes nothing (retains previous valid level).
* The constructor `Thermostat(int level)` routes its argument through `setLevel`. Because fields initialize to default values (0 for int), an invalid constructor argument leaves the level at `50` (the lower bound default fallback).
* `getLevel()` returns the level.
* `up()` raises the level by 1 unless it is already 90 (clamped).
* `down()` lowers the level by 1 unless it is already 50 (clamped).
* `Main.java` is a test driver; do not edit it.

### Sample
```java
Thermostat t = new Thermostat(72);
t.up();
t.getLevel();       // -> 73
t.setLevel(105);
t.getLevel();       // -> 73
new Thermostat(45).getLevel(); // -> 50
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Up raises level, out-of-range 105 rejected, bad starting value 45 defaults to 50.
* **Test 2 [Hidden] (Boundary Clamping at 90):** At level 90, calling `up()` ten times keeps level at exactly 90.
* **Test 3 [Hidden] (Boundary Clamping at 50):** At level 50, calling `down()` ten times keeps level at exactly 50.
* **Test 4 [Hidden] (Off-by-One Constructor Rejection):** `new Thermostat(49)` and `new Thermostat(91)` default to 50.
* **Test 5 [Hidden] (Off-by-One Setter Rejection):** At level 70, calling `setLevel(49)` and `setLevel(91)` preserves 70.
* **Test 6 [Hidden] (Exact In-Range Edges):** `new Thermostat(50)` gives 50; `new Thermostat(90)` gives 90. `setLevel(50)` and `setLevel(90)` update successfully.

---

## Q4: Renewable Grid (10 Points) - *Interfaces & Polymorphism*
Files given (read-only):
* `PowerSource.java`: an interface with two promises: `String sourceName()` and `double dailyOutputKWh()`.
* `WindTurbine.java` and `SolarArray.java`: implement `PowerSource`.
* `Main.java`: testing driver.

Your task:
Write `RenewableGrid.java`, which contains two static methods working for **any** `PowerSource`:
* `static double totalOutput(PowerSource[] sources)` returns the sum of every `dailyOutputKWh()`.
* `static String primarySource(PowerSource[] sources)` returns the `sourceName()` of the element with the largest `dailyOutputKWh()`.
  * **Tie-Breaking Trap:** If multiple sources share the highest output, the **first one encountered** in array order wins.
  * **Drawdown Trap:** A `dailyOutputKWh()` may be negative (battery storage recharging drawdown).
  * **Empty Array Trap:** An empty array (`length == 0`) returns `0.0` for total and `""` for primary.
  * **Null Element Trap:** If an element in `sources` is `null`, skip it without throwing `NullPointerException`.

### Sample
```java
PowerSource[] grid = { new WindTurbine("Benton-1"), new SolarArray("Rooftop-4") };
// Benton-1 output is 450.0; Rooftop-4 output is 120.0
RenewableGrid.totalOutput(grid);   // -> 570.0
RenewableGrid.primarySource(grid); // -> "Benton-1"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Sum of positive outputs and primary identification.
* **Test 2 [Hidden] (Sparse Array with Nulls):** Array containing `{null, new SolarArray("S1"), null}` calculates without `NullPointerException`.
* **Test 3 [Hidden] (All Negative Outputs):** Sources with outputs `{-150.0, -40.0, -90.0}`: primary must be `-40.0`, not `0.0` or `-150.0`.
* **Test 4 [Hidden] (Exact Floating Point Tie):** Two sources with identical output of `300.0` returns the first source's name.
* **Test 5 [Hidden] (Array of Only Nulls):** `{null, null}` returns `0.0` and `""`.
* **Test 6 [Hidden] (Empty Array):** `new PowerSource[0]` returns `0.0` and `""`.

---

## Q5: Package Shipment Overloading (10 Points) - *Overloading & Constructor Chaining*
Implement `Shipment.java` with private fields: `String destination`, `double weightLbs`, and `boolean express`.

Implement constructor and method overloading:
* `Shipment(String destination, double weightLbs, boolean express)`: stores all three fields.
* `Shipment(String destination, double weightLbs)`: overloads constructor, defaulting `express` to `false` (chain using `this(...)`).
* `Shipment(String destination)`: overloads constructor, defaulting `weightLbs` to `1.0` and `express` to `false` (chain using `this(...)`).
* `getDestination()`, `getWeightLbs()`, and `isExpress()` return the fields.
* `calculateCost()` computes shipping cost as `$5.00 + (weightLbs * 1.50)`. If `express` is true, add a flat `$10.00` surcharge.
* `calculateCost(double discountDollar)`: overloads `calculateCost()` by subtracting `discountDollar`.
  * **Negative Cost Floor:** If calculated cost drops below `0.0`, clamp to `0.0`.
  * **Negative Discount Trap:** If `discountDollar < 0.0`, treat `discountDollar` as `0.0` (do not increase price).

### Sample
```java
Shipment s1 = new Shipment("Chicago", 4.0, true);
Shipment s2 = new Shipment("Indianapolis");
s1.calculateCost();        // 5 + 6 + 10 -> 21.0
s1.calculateCost(5.0);     // 21.0 - 5.0 -> 16.0
s2.getWeightLbs();         // -> 1.0
s2.isExpress();            // -> false
s2.calculateCost(50.0);    // clamped at 0.0 -> 0.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 3-arg, 1-arg defaults, base cost, and discount overload with 0.0 floor.
* **Test 2 [Hidden] (Negative Discount Trap):** Calling `calculateCost(-15.0)` does not add $15 to the cost; returns base cost.
* **Test 3 [Hidden] (Zero Weight Package):** Package with 0.0 lbs non-express costs base fee `$5.00`.
* **Test 4 [Hidden] (Constructor Delegation Enforcement):** Source code inspection validates constructors chain via `this(...)`.
* **Test 5 [Hidden] (Exact Cost Discount):** Discount equal to cost produces exactly `0.0`.
* **Test 6 [Hidden] (Double Precision Handling):** Weight of `3.33` lbs calculated without truncated integer arithmetic.

---

## Q6: Subscription Account (10 Points) - *Composition & Dynamic Querying*
`User.java` is given and complete: `User(String username, boolean student)` with `getUsername()`, `isStudent()`, and `setStudent(boolean student)`. Do not edit `User.java`.

Implement `Subscription.java`; all fields must be private:
* `Subscription(User user, int months, double monthlyRate)` stores all three fields.
* `getUser()` and `getMonths()` return the fields; `setMonths(int months)` changes the months.
* `totalCost()` is `months * monthlyRate`. A student user pays 20% less (`0.80 * total`).
  * **Dynamic Delegation Trap:** `totalCost()` **must query** `user.isStudent()` each time it is called. Changing `user.setStudent(...)` must immediately reflect in subsequent `totalCost()` and `toString()` outputs.
* `toString()` returns exactly: `Subscription[<username>, <months> months, $<totalCost formatted to 2 decimals>]`. Use the word `months` even if months is 1.

### Sample
```java
User u = new User("Alice", true);
Subscription s = new Subscription(u, 3, 10.0);
s.totalCost();   // -> 24.0
s.toString();    // -> "Subscription[Alice, 3 months, $24.00]"
u.setStudent(false);
s.totalCost();   // -> 30.0
s.toString();    // -> "Subscription[Alice, 3 months, $30.00]"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Student discount, exact `toString()`, dynamic cost change when user state mutates.
* **Test 2 [Hidden] (User Object Aliasing):** Two `Subscription` objects referencing the same `User` update simultaneously when the shared user changes.
* **Test 3 [Hidden] (Single Month Grammatical Trap):** `months = 1` must still output `1 months` (not `1 month`).
* **Test 4 [Hidden] (Zero Rate / Free Trial):** `monthlyRate = 0.0` formats as `$0.00`.
* **Test 5 [Hidden] (Exact 2-Decimal Padding):** A calculated total of `12.5` formats as `$12.50`.
* **Test 6 [Hidden] (Mutator Recalculation):** Changing `setMonths(12)` recalculates cost with discount dynamically.

---

## Q7: Robust Port Number (12 Points) - *Exception Handling & Scanner Loops*
Write a program in `Main.java`:

Ask `Enter port: ` until the user enters a whole number from `1024` to `65535` inclusive.
* For any input that cannot be parsed as an integer (e.g., text, floating-point numbers, empty line), print `Not a number.`.
* For any integer outside `1024` to `65535`, print `Out of range.`.
* When an acceptable port is entered, print `Port: ` followed by the port, and then on the next line print `Attempts: ` followed by the total number of attempts.
* Every prompt counts as one attempt, including rejected attempts and the final accepted attempt.
* **Crash-Proof Trap:** The program must handle leading/trailing spaces, massive numbers exceeding `Integer.MAX_VALUE` (e.g., `999999999999`), and blank inputs without crashing.

### Sample
```
Enter port: [http]
Not a number.
Enter port: [80]
Out of range.
Enter port: [8080]
Port: 8080
Attempts: 3
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Non-number, out of range, valid entry, 3 attempts.
* **Test 2 [Hidden] (Integer Overflow Input):** Entering `999999999999` throws `NumberFormatException` internally and prints `Not a number.` without crashing.
* **Test 3 [Hidden] (Whitespace Padding):** Input `"  8080  "` parses cleanly as `8080`.
* **Test 4 [Hidden] (Exact Inclusive Bounds):** `1024` and `65535` accepted on attempt 1.
* **Test 5 [Hidden] (Exact Off-by-One Rejections):** `1023` and `65536` print `Out of range.`.
* **Test 6 [Hidden] (Negative Numbers):** `-8080` prints `Out of range.` (is a valid integer, but out of bounds).
* **Test 7 [Hidden] (Float/Double Trap):** `8080.0` prints `Not a number.`.

---

## Q8: Server Response Times (12 Points) - *File Processing & Exceptions*
`latencies.txt` holds one server ping latency in milliseconds per line: a positive whole number. Read the file and write `metrics.txt` holding exactly these four lines:

```
Pings: <count>
Average: <average with exactly 2 decimal places>
Slowest: <maximum value>
Exceeds threshold: <number of pings strictly greater than 100>
```

If `latencies.txt` cannot be opened or does not exist, print exactly one line to the screen: `Cannot open latencies.txt.`, write no report file, and terminate without crashing. `Main.java` holds an empty `main`; write your solution there.

### Sample
`latencies.txt`:
```
45
120
85
210
95
```
`metrics.txt`:
```
Pings: 5
Average: 111.00
Slowest: 210
Exceeds threshold: 2
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 5 lines processed, 2-decimal average, max latency, count strictly > 100.
* **Test 2 [Hidden] (Missing File Clean Failure):** Missing file prints `Cannot open latencies.txt.` to console, creates NO `metrics.txt` file, exits cleanly.
* **Test 3 [Hidden] (Strict Greater-Than Threshold):** Ping of exactly `100` is **not** counted in `Exceeds threshold`.
* **Test 4 [Hidden] (Single-Line File):** File with only `42` computes Pings: 1, Average: 42.00, Slowest: 42, Exceeds: 0.
* **Test 5 [Hidden] (Rounding Boundary):** Average resulting in `.005` rounds up properly according to standard double formatting (`%.2f`).
* **Test 6 [Hidden] (Trailing Blank Lines):** File with empty trailing lines does not crash or inflate ping count.

---

## Q9: Senior Project Leader (12 Points) - *Inheritance & Super Delegation*
`Student.java` is given and complete: `Student(String name, double gpa)` with `getName()`, `getGpa()`, `double stipend(int credits)` (calculated as `credits * 50.0`), and `toString()` returning `<name> (<gpa> GPA)`. It has no zero-argument constructor. Do not edit `Student.java`.

Write `ProjectLeader.java`: a project leader **is a** `Student` with a leadership grant.
* `ProjectLeader(String name, double gpa, double leadershipGrant)`.
* `getLeadershipGrant()` returns the grant.
* `stipend(int credits)`: returns the student stipend for those credits plus the leadership grant added once.
  * **Super Delegation Constraint:** The override **must** build on the parent's logic by calling `super.stipend(credits)`.
* `toString()` returns the student description followed by ` (leader)`.
  * **Super Delegation Constraint:** The override **must** build on `super.toString()`.
* All new fields must be private.

### Sample
```java
ProjectLeader p = new ProjectLeader("Ada", 3.8, 200.0);
p.getName();               // -> "Ada"
p.stipend(6);              // 6 * 50 + 200 -> 500.0
p.stipend(0);              // -> 200.0
p.toString();              // -> "Ada (3.8 GPA) (leader)"
Student s = p;
s.stipend(6);              // -> 500.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Super constructor, stipend with grant, 0 credits stipend, `toString()` appending ` (leader)`, polymorphic assignment.
* **Test 2 [Hidden] (Parent Recompilation Test):** Grader swaps `Student.java` with a version that changes credit calculation formula to `credits * 75.0`. If student hardcoded `credits * 50.0` instead of calling `super.stipend(credits)`, test fails.
* **Test 3 [Hidden] (Parent toString Recompilation):** Grader swaps `Student.java` to format GPA with brackets `[GPA: 3.8]`. If student hardcoded string concatenation instead of `super.toString()`, test fails.
* **Test 4 [Hidden] (Zero Grant):** Grant of `0.0` yields exact parent stipend.
* **Test 5 [Hidden] (Field Encapsulation):** All declared fields in `ProjectLeader` confirmed private.

---

## Q10: Animal Shelter Registry (12 Points) - *instanceof & Downcasting*
`Animal.java`, `Dog.java`, and `Cat.java` are given and read-only:
* `Animal(String name)` with `getName()`.
* `Dog extends Animal`: has method `String getBreed()`.
* `Cat extends Animal`: has method `boolean isIndoor()`.
* The test cases also use other subclasses of `Animal` you have never seen (e.g., `Bird extends Animal`).

Write `ShelterRegistry.java` containing two static methods:
* `static String identify(Animal a)`:
  * If `a` is a `Dog`, returns `Dog: ` followed by its breed (e.g. `Dog: Golden`).
  * If `a` is a `Cat`, returns `Cat (indoor)` if `isIndoor()` is true, or `Cat (outdoor)` if false.
  * For any other `Animal`, returns `Animal: ` followed by its name (e.g. `Animal: Pip`).
* `static int countDogs(Animal[] animals)`: returns how many elements in the array are instances of `Dog`.
* **Null Safety Trap:** If `animals` contains `null` elements, skip them without throwing `NullPointerException`. If `a` passed to `identify` is `null`, return `"None"`.

### Sample
```java
Animal d = new Dog("Buddy", "Golden");
Animal c = new Cat("Luna", true);
Animal o = new Animal("Pip");
ShelterRegistry.identify(d); // -> "Dog: Golden"
ShelterRegistry.identify(c); // -> "Cat (indoor)"
ShelterRegistry.identify(o); // -> "Animal: Pip"
ShelterRegistry.countDogs(new Animal[] { d, c, o }); // -> 1
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Identifies Dog, indoor Cat, base Animal; counts 1 dog in array.
* **Test 2 [Hidden] (Null Safety Checks):** `identify(null)` returns `"None"`; `countDogs(new Animal[]{null, d, null})` returns `1`.
* **Test 3 [Hidden] (Unseen Subclasses):** Unseen class `Ferret extends Animal` returns `Animal: <name>`.
* **Test 4 [Hidden] (Subclass of Dog):** Class `GuideDog extends Dog` is counted as a `Dog` and returns `Dog: <breed>`.
* **Test 5 [Hidden] (Cat Outdoor Condition):** Cat with `isIndoor() == false` returns `Cat (outdoor)`.
* **Test 6 [Hidden] (Empty Array):** `new Animal[0]` returns `0`.

---

# Practice Exam 2

## Q1: Audit Log (6 Points) - *File I/O*
Write a program in `Main.java` that creates a file named `audit.log` containing exactly these three lines:

```
[START] System initialized.
[AUTH] User admin verified.
[END] Session terminated.
```

Each line must end with a newline character (`\n`), including the last. If `audit.log` exists, replace its contents cleanly. The program prints nothing to the console.

### Sample
After execution, `audit.log` contains the three lines above and nothing else.

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** File `audit.log` exists with exact text and terminal newline.
* **Test 2 [Hidden] (Clean Truncation):** Truncates existing file containing 50KB of data to exact 3 lines.
* **Test 3 [Hidden] (Silent Console):** No output on `System.out` or `System.err`.
* **Test 4 [Hidden] (Case and Space Precision):** Exact bracket formatting `[AUTH]` and spacing verified.

---

## Q2: Digital Book (8 Points) - *Classes & Static Fields*
Implement the class `DigitalBook` in `DigitalBook.java`; fields must be private.

* A digital book knows its title (`String`) and file size in megabytes (`double`).
* `DigitalBook(String title, double sizeMB)` stores both fields and increments a static download counter.
* `getTitle()` and `getSizeMB()` return the fields; `setSizeMB(double sizeMB)` updates the file size.
* `static int getTotalDownloads()` returns the total number of `DigitalBook` instances created.

### Sample
```java
DigitalBook b1 = new DigitalBook("Java Basics", 4.2);
DigitalBook b2 = new DigitalBook("Algorithms", 12.0);
b1.getTitle();                     // -> "Java Basics"
b1.getSizeMB();                    // -> 4.2
DigitalBook.getTotalDownloads();   // -> 2
b1.setSizeMB(5.0);
b1.getSizeMB();                    // -> 5.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 2 instances created, getters, setter, static downloads returns 2.
* **Test 2 [Hidden] (Static Isolation):** Calling `getTotalDownloads()` prior to any instantiation returns `0`.
* **Test 3 [Hidden] (Zero File Size):** Size `0.0` stores accurately without resetting counter.
* **Test 4 [Hidden] (Field Encapsulation):** All fields confirmed `private`.
* **Test 5 [Hidden] (Null Title):** `new DigitalBook(null, 5.0)` increments downloads without crashing.

---

## Q3: Audio Equalizer (8 Points) - *Encapsulation & Bounds*
Write the class `AudioEqualizer` in `AudioEqualizer.java`; all fields must be private.

* A bass gain level is an integer from -12 to 12 decibels (dB) inclusive.
* `setBass(int bass)` updates the bass level only if it is within `[-12, 12]`; an out-of-range value changes nothing.
* The constructor `AudioEqualizer(int bass)` sends its argument through `setBass`. An invalid initial value leaves the bass at `0`.
* `getBass()` returns the current bass level.
* `boost()` raises the bass by 1 unless it is already 12.
* `cut()` lowers the bass by 1 unless it is already -12.

### Sample
```java
AudioEqualizer eq = new AudioEqualizer(11);
eq.boost();
eq.getBass();       // -> 12
eq.boost();
eq.getBass();       // -> 12
eq.setBass(25);
eq.getBass();       // -> 12
new AudioEqualizer(-20).getBass(); // -> 0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Boost to upper limit 12, rejected out-of-range 25, invalid constructor defaults to 0.
* **Test 2 [Hidden] (Negative Symmetrical Clamp):** At -12, calling `cut()` 5 times remains at -12.
* **Test 3 [Hidden] (Off-by-One Constructor Rejection):** `new AudioEqualizer(-13)` and `new AudioEqualizer(13)` default to 0.
* **Test 4 [Hidden] (Off-by-One Setter Rejection):** At 5, calling `setBass(13)` or `setBass(-13)` keeps 5.
* **Test 5 [Hidden] (Exact Minimum Valid Value):** `new AudioEqualizer(-12)` initializes to -12.

---

## Q4: Medical Clinic Triage (10 Points) - *Interfaces & Polymorphism*
Files given (read-only):
* `Triageable.java`: interface with `String patientName()` and `int urgencyScore()`. `urgencyScore()` can be negative (administrative records).
* `WalkInPatient.java` and `EmergencyPatient.java` implementing `Triageable`.
* `Main.java`: test driver.

Write `ClinicTriage.java` containing two static methods:
* `static int totalUrgency(Triageable[] queue)`: returns the sum of every `urgencyScore()`.
* `static String mostUrgent(Triageable[] queue)`: returns the `patientName()` of the element with the largest `urgencyScore()`.
  * **Tie-Breaking Rule:** On a tie, the first one encountered wins.
  * **Empty Array Rule:** An empty array returns `0` and `""`.
  * **Null Safety:** Skip any `null` elements in `queue` safely.

### Sample
```java
Triageable[] queue = { new WalkInPatient("John"), new EmergencyPatient("Mia") };
// John score is 20; Mia score is 85
ClinicTriage.totalUrgency(queue); // -> 105
ClinicTriage.mostUrgent(queue);   // -> "Mia"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Sums urgency scores and identifies highest urgency patient.
* **Test 2 [Hidden] (All Negative Urgency Scores):** Scores `{-50, -10, -30}` returns most urgent `-10`.
* **Test 3 [Hidden] (Array with Nulls):** `{null, new WalkInPatient("A"), null}` calculates without crashing.
* **Test 4 [Hidden] (Empty Queue):** `new Triageable[0]` returns `0` and `""`.
* **Test 5 [Hidden] (Tied High Scores):** Two patients tied at score 90 returns the first patient's name.

---

## Q5: Flight Reservation Overloading (10 Points) - *Overloading & Constructor Chaining*
Create `FlightBooking` in `FlightBooking.java` with private fields: `String flightCode`, `int seatNumber`, and `boolean firstClass`.

Implement constructor and method overloading:
* `FlightBooking(String flightCode, int seatNumber, boolean firstClass)`: sets all fields.
* `FlightBooking(String flightCode, int seatNumber)`: overloads constructor, defaulting `firstClass` to `false` (chain using `this(...)`).
* `FlightBooking(String flightCode)`: overloads constructor, defaulting `seatNumber` to `30` and `firstClass` to `false` (chain using `this(...)`).
* `getFlightCode()`, `getSeatNumber()`, and `isFirstClass()` return the fields.
* `baggageFee(int bags)`: first bag is free (if bags >= 1); each additional bag costs `$35.00`. If `firstClass` is true, all bags are free (`0.0`).
* `baggageFee(int bags, double overweightFeePerBag)`: overloads `baggageFee` by adding `overweightFeePerBag` to every bag charged (firstClass still receives all bags free).
  * If `bags <= 0`, return `0.0`.

### Sample
```java
FlightBooking b1 = new FlightBooking("DL180", 12, false);
FlightBooking b2 = new FlightBooking("UA450");
b1.baggageFee(3);          // (3 - 1) * 35 -> 70.0
b1.baggageFee(3, 15.0);    // (3 - 1) * (35 + 15) -> 100.0
b2.getSeatNumber();        // -> 30
b2.isFirstClass();         // -> false
FlightBooking b3 = new FlightBooking("AA100", 2, true);
b3.baggageFee(5, 50.0);    // first class -> 0.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 3-arg, 1-arg defaults, baggage fee, overweight fee overload, first class waiver.
* **Test 2 [Hidden] (Single Bag Boundary):** Exactly 1 bag returns `0.0` (first bag is free).
* **Test 3 [Hidden] (Zero or Negative Bags):** 0 bags or negative bags returns `0.0`.
* **Test 4 [Hidden] (First Class Overweight Immunity):** First class with 10 bags and $100 overweight fee per bag still returns `0.0`.
* **Test 5 [Hidden] (Constructor Chaining Check):** Verifies constructor delegation via `this(...)`.

---

## Q6: Car Rental Agreement (10 Points) - *Composition & Dynamic Delegation*
`Driver.java` is given: `Driver(String name, boolean insuranceVerified)` with `getName()`, `hasInsurance()`, and `setInsurance(boolean insuranceVerified)`. Do not edit `Driver.java`.

Implement `RentalAgreement.java`; all fields must be private:
* `RentalAgreement(Driver driver, int days, double dailyRate)` stores all three fields.
* `getDriver()` and `getDays()` return the fields; `setDays(int days)` changes the days.
* `cost()`: `days * dailyRate`. If `driver.hasInsurance()` is false, add an uninsured motorist fee of `$15.00` per day (`days * 15.0`).
  * Evaluates `driver.hasInsurance()` **dynamically every time** `cost()` is called.
* `toString()` returns: `Rental[<name>, <days> days, $<cost formatted to 2 decimals>]`. Use `days` even if days is 1.

### Sample
```java
Driver d = new Driver("Bob", false);
RentalAgreement r = new RentalAgreement(d, 4, 50.0);
r.cost();       // 4 * 50 + 4 * 15 -> 260.0
r.toString();   // -> "Rental[Bob, 4 days, $260.00]"
d.setInsurance(true);
r.cost();       // 4 * 50 -> 200.0
r.toString();   // -> "Rental[Bob, 4 days, $200.00]"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Uninsured fee addition, exact `toString()`, dynamic cost update on insurance state change.
* **Test 2 [Hidden] (Toggling Insurance Back and Forth):** Changing insurance multiple times recalculates cost accurately.
* **Test 3 [Hidden] (Single Day Rental):** `days = 1` must still output `1 days`.
* **Test 4 [Hidden] (Zero Daily Rate):** `dailyRate = 0.0` uninsured for 3 days returns `$45.00`.
* **Test 5 [Hidden] (Decimal Cent Precision):** Rates with fractional cents (e.g., $49.99) format cleanly to 2 decimals.

---

## Q7: Robust Item Count (12 Points) - *Input Validation & Exception Loops*
Write a program in `Main.java`:

Ask `Enter items: ` until the user enters a whole number from `1` to `500` inclusive.
* For any input that cannot be parsed as an integer, print `Not an integer.`.
* For any integer outside `1` to `500`, print `Invalid count.`.
* When accepted, print `Accepted: ` followed by the number, then on the next line print `Total attempts: ` followed by the attempt count.
* Every prompt counts as one attempt. Never crash.

### Sample
```
Enter items: [dozen]
Not an integer.
Enter items: [0]
Invalid count.
Enter items: [45]
Accepted: 45
Total attempts: 3
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Non-integer, invalid 0 count, valid entry, 3 attempts.
* **Test 2 [Hidden] (Huge Number Overflow):** Input `9999999999999` prints `Not an integer.` without crashing.
* **Test 3 [Hidden] (Zero and Negative Numbers):** `0` and `-5` print `Invalid count.`.
* **Test 4 [Hidden] (Exact Bounds):** `1` and `500` accepted on attempt 1.
* **Test 5 [Hidden] (Decimal Input):** `10.5` prints `Not an integer.`.

---

## Q8: Rain Gauge Summary (12 Points) - *File Processing & Summary*
`rainfall.txt` holds daily rainfall in millimeters per line: an integer `>= 0`. Read the file and write `rain_report.txt` with these four lines:

```
Days: <total lines>
Average: <average with exactly 2 decimal places>
Max rainfall: <largest value>
Dry days: <number of days with exactly 0 rainfall>
```

If `rainfall.txt` cannot be opened or does not exist, print `Cannot open rainfall.txt.` to the screen, write no report file, and terminate cleanly.

### Sample
`rainfall.txt`:
```
0
14
0
22
8
```
`rain_report.txt`:
```
Days: 5
Average: 8.80
Max rainfall: 22
Dry days: 2
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 5 days, 8.80 avg, max 22, 2 dry days (value 0).
* **Test 2 [Hidden] (Missing File Clean Failure):** Prints `Cannot open rainfall.txt.`, creates no file.
* **Test 3 [Hidden] (All Dry Days):** File with all `0`s gives Days: 3, Average: 0.00, Max rainfall: 0, Dry days: 3.
* **Test 4 [Hidden] (Zero Dry Days):** File with positive rainfalls outputs `Dry days: 0`.
* **Test 5 [Hidden] (Single Day Entry):** Single line file processed accurately.

---

## Q9: Executive Account (12 Points) - *Inheritance & Super Delegation*
`BankAccount.java` is given and complete: `BankAccount(String owner, double balance)` with `getOwner()`, `getBalance()`, `double deposit(double amount)` (balance + amount), and `toString()` returning `Account[<owner>: $<balance formatted to 2 decimals>]`. Do not change `BankAccount.java`.

Write `ExecutiveAccount.java`: an executive account **is a** `BankAccount` with an investment match.
* `ExecutiveAccount(String owner, double balance, double matchPercentage)`.
* `getMatchPercentage()` returns the match percentage (e.g. `5.0` for 5%).
* `deposit(double amount)`: calls `super.deposit(amount)` and additionally adds `amount * (matchPercentage / 100.0)` to the balance.
* `toString()` returns the parent's `toString()` followed by ` (Executive)`.
* Overrides **must** call `super.deposit(...)` and `super.toString()`. All new fields must be private.

### Sample
```java
ExecutiveAccount a = new ExecutiveAccount("Bruce", 1000.0, 10.0);
a.getOwner();            // -> "Bruce"
a.deposit(200.0);        // 1000 + 200 + 20 -> 1220.0
a.toString();            // -> "Account[Bruce: $1220.00] (Executive)"
BankAccount b = a;
b.deposit(100.0);        // 1220 + 100 + 10 -> 1330.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Super constructor, deposit with match bonus, `toString()` appending ` (Executive)`, polymorphic call.
* **Test 2 [Hidden] (Parent Recompilation Verification):** Swapping parent `BankAccount` to deduct a $1 fee on deposit verifies student didn't bypass `super.deposit(...)`.
* **Test 3 [Hidden] (Zero Match):** Match percentage `0.0` behaves identically to standard deposit.
* **Test 4 [Hidden] (Field Encapsulation):** All new fields private.

---

## Q10: Media Library Classifier (12 Points) - *instanceof & Downcasting*
`Media.java`, `Movie.java`, and `Podcast.java` are given and read-only:
* `Media(String title)` with `getTitle()`.
* `Movie extends Media`: has method `int getDurationMinutes()`.
* `Podcast extends Media`: has method `String getHost()`.

Write `MediaClassifier.java` containing two static methods:
* `static String describe(Media m)`:
  * For a `Movie`, returns `Movie: ` followed by title and duration in brackets (e.g. `Movie: Inception [148 mins]`).
  * For a `Podcast`, returns `Podcast: ` followed by title and host in parentheses (e.g. `Podcast: Daily (Host: Michael)`).
  * For any other `Media`, returns `Media: ` followed by title.
  * If `m` is `null`, return `"None"`.
* `static int countMovies(Media[] items)`: returns how many elements are instances of `Movie`. Safely ignores `null` elements.

### Sample
```java
Media m1 = new Movie("Inception", 148);
Media m2 = new Podcast("Daily", "Michael");
Media m3 = new Media("Audiobook");
MediaClassifier.describe(m1); // -> "Movie: Inception [148 mins]"
MediaClassifier.describe(m2); // -> "Podcast: Daily (Host: Michael)"
MediaClassifier.describe(m3); // -> "Media: Audiobook"
MediaClassifier.countMovies(new Media[] { m1, m2, m3 }); // -> 1
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Describes Movie, Podcast, base Media; counts 1 movie.
* **Test 2 [Hidden] (Null Safety):** `describe(null)` returns `"None"`; `countMovies(new Media[]{null, m1, null})` returns `1`.
* **Test 3 [Hidden] (Unseen Media Subclass):** Subclass `Audiobook extends Media` returns `Media: <title>`.
* **Test 4 [Hidden] (Subclass of Movie):** `FeatureFilm extends Movie` correctly downcasts as a `Movie` and returns `Movie: <title> [<dur> mins]`.
* **Test 5 [Hidden] (Empty Array):** `new Media[0]` returns `0`.

---

# Practice Exam 3

## Q1: Sensor Manifest (6 Points) - *File I/O*
Write a program in `Main.java` that creates `sensor.cfg` holding exactly these three lines:

```
SENSOR_ID=TH-902
INTERVAL=60
CALIBRATED=YES
```

Each line ends with a line break. If `sensor.cfg` exists, replace its contents cleanly. Prints nothing to the screen.

### Sample
After execution, `sensor.cfg` holds the three lines above and nothing else.

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** File `sensor.cfg` created with exact 3 lines.
* **Test 2 [Hidden] (Overwrite Mode):** Replaces pre-existing file content cleanly.
* **Test 3 [Hidden] (Console Silence):** No console output.
* **Test 4 [Hidden] (Exact Newline):** Every line ends with `\n`.

---

## Q2: Crypto Wallet (8 Points) - *Classes & Static Fields*
Implement `CryptoWallet` in `CryptoWallet.java`; fields must be private.

* A wallet knows its coin symbol (`String`) and balance (`double`).
* `CryptoWallet(String coinSymbol, double balance)` stores both and increments a static wallet creation count.
* `getCoinSymbol()` and `getBalance()` return the fields; `setBalance(double balance)` updates the balance.
* `static int getWalletCount()` returns the total number of `CryptoWallet` objects created.

### Sample
```java
CryptoWallet w1 = new CryptoWallet("BTC", 1.5);
CryptoWallet w2 = new CryptoWallet("ETH", 10.0);
w1.getCoinSymbol();             // -> "BTC"
w1.getBalance();                // -> 1.5
CryptoWallet.getWalletCount();  // -> 2
w1.setBalance(2.0);
w1.getBalance();                // -> 2.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 2 instances created, getters, mutator, static count check.
* **Test 2 [Hidden] (Initial Static State):** `getWalletCount()` returns 0 before any creation.
* **Test 3 [Hidden] (Zero Balance):** Setting balance to `0.0` updates correctly.
* **Test 4 [Hidden] (Null Symbol Handling):** Handles `null` coin symbol without crashing.
* **Test 5 [Hidden] (Private Fields):** Reflection test verifies private encapsulation.

---

## Q3: Drone Throttle (8 Points) - *Encapsulation & Bounds*
Write the class `DroneThrottle` in `DroneThrottle.java`; all fields must be private.

* Throttle percent is an integer from `0` to `100` inclusive.
* `setThrottle(int throttle)` stores the value only if it is in `[0, 100]`; an out-of-range value changes nothing.
* The constructor `DroneThrottle(int throttle)` sends its argument through `setThrottle`. A bad starting value leaves throttle at `0`.
* `getThrottle()` returns the current value.
* `accelerate()` raises throttle by 5 unless it would exceed 100, in which case it sets throttle to 100 (capped).
* `brake()` lowers throttle by 5 unless it would drop below 0, in which case it sets throttle to 0 (floored).

### Sample
```java
DroneThrottle d = new DroneThrottle(92);
d.accelerate();
d.getThrottle();       // -> 97
d.accelerate();
d.getThrottle();       // -> 100 (capped)
d.setThrottle(150);
d.getThrottle();       // -> 100
new DroneThrottle(-10).getThrottle(); // -> 0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Accelerates by 5, caps at 100, invalid setter rejected, invalid constructor defaults to 0.
* **Test 2 [Hidden] (Off-by-One Brake Floor):** Throttle at 2, calling `brake()` floors at 0.
* **Test 3 [Hidden] (Off-by-One Accelerate Cap):** Throttle at 99, calling `accelerate()` caps at 100.
* **Test 4 [Hidden] (Exact Bounds):** Setting throttle to 0 and 100 succeed.
* **Test 5 [Hidden] (Constructor Boundary Rejection):** `new DroneThrottle(101)` and `new DroneThrottle(-1)` default to 0.

---

## Q4: Freight Delivery (10 Points) - *Interfaces & Polymorphism*
Files given (read-only):
* `Cargo.java`: interface with `String manifestId()` and `double weightTons()`. `weightTons()` may be negative (ballast discharge).
* `BulkGrain.java` and `ContainerBox.java` implementing `Cargo`.
* `Main.java`: testing driver.

Write `FreightConsolidator.java` containing two static methods:
* `static double totalTonnage(Cargo[] shipments)`: returns the sum of every `weightTons()`.
* `static String heaviestCargo(Cargo[] shipments)`: returns the `manifestId()` of the element with the largest `weightTons()`.
  * **Tie Rule:** On a tie, the first one encountered wins.
  * **Empty Rule:** An empty array returns `0.0` and `""`.
  * **Null Safety:** Safely skip `null` elements in `shipments`.

### Sample
```java
Cargo[] manifest = { new BulkGrain("GRAIN-01"), new ContainerBox("BOX-99") };
// GRAIN-01 weight is 1200.0; BOX-99 weight is 450.0
FreightConsolidator.totalTonnage(manifest);  // -> 1650.0
FreightConsolidator.heaviestCargo(manifest); // -> "GRAIN-01"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Sums tonnage and returns manifest ID of heaviest cargo.
* **Test 2 [Hidden] (Negative Tonnage Maximum):** Array of `{-400.0, -100.0, -250.0}` identifies `-100.0` as heaviest.
* **Test 3 [Hidden] (Array with Nulls):** Sum and heaviest work on array containing `null` values.
* **Test 4 [Hidden] (Exact Weight Tie):** First cargo wins tie.
* **Test 5 [Hidden] (Empty Array):** Returns `0.0` and `""`.

---

## Q5: Hotel Room Booking Overloading (10 Points) - *Overloading & Constructor Chaining*
Create `RoomBooking` in `RoomBooking.java` with private fields: `String guestName`, `int nights`, and `boolean suite`.

Implement constructor and method overloading:
* `RoomBooking(String guestName, int nights, boolean suite)`: initializes all fields.
* `RoomBooking(String guestName, int nights)`: overloads constructor, defaulting `suite` to `false` (chain using `this(...)`).
* `RoomBooking(String guestName)`: overloads constructor, defaulting `nights` to `1` and `suite` to `false` (chain using `this(...)`).
* `getGuestName()`, `getNights()`, and `isSuite()` return the fields.
* `totalPrice()`: base room rate is `$100.0` per night. If `suite` is true, rate is `$180.0` per night.
* `totalPrice(double loyaltyCredit)`: overloads `totalPrice` by subtracting `loyaltyCredit`. Total price cannot drop below `0.0`.
  * If `loyaltyCredit < 0.0`, treat `loyaltyCredit` as `0.0`.

### Sample
```java
RoomBooking b1 = new RoomBooking("Carol", 3, true);
RoomBooking b2 = new RoomBooking("Dave");
b1.totalPrice();          // 3 * 180 -> 540.0
b1.totalPrice(100.0);     // 540 - 100 -> 440.0
b2.getNights();           // -> 1
b2.isSuite();             // -> false
b2.totalPrice(200.0);     // 100 - 200 -> clamped at 0.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Suite pricing, loyalty credit deduction, 1-arg defaults, clamping at 0.0.
* **Test 2 [Hidden] (Negative Loyalty Credit):** Credit `-50.0` does not raise the price.
* **Test 3 [Hidden] (Constructor Chaining Check):** Validates delegation via `this(...)`.
* **Test 4 [Hidden] (Zero Loyalty Credit):** Credit 0.0 returns exact base price.
* **Test 5 [Hidden] (Exact Price Credit):** Credit matching cost results in `0.0`.

---

## Q6: Fitness Membership (10 Points) - *Composition & Dynamic Delegation*
`Member.java` is given: `Member(String name, boolean trainerPackage)` with `getName()`, `hasTrainer()`, and `setTrainer(boolean trainerPackage)`. Do not edit `Member.java`.

Implement `GymContract.java`; all fields must be private:
* `GymContract(Member member, int months, double baseMonthlyFee)` stores all three fields.
* `getMember()` and `getMonths()` return the fields; `setMonths(int months)` updates the months.
* `monthlyRate()`: returns `baseMonthlyFee`. If `member.hasTrainer()` is true, add `$40.00` per month to the rate.
  * Queries `hasTrainer()` dynamically **every time** `monthlyRate()` is called.
* `toString()` returns: `Contract[<name>, <months> months, $<monthlyRate formatted to 2 decimals>/mo]`. Use `months` even for 1.

### Sample
```java
Member m = new Member("Carol", true);
GymContract c = new GymContract(m, 6, 30.0);
c.monthlyRate();  // 30 + 40 -> 70.0
c.toString();     // -> "Contract[Carol, 6 months, $70.00/mo]"
m.setTrainer(false);
c.monthlyRate();  // -> 30.0
c.toString();     // -> "Contract[Carol, 6 months, $30.00/mo]"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Trainer add-on fee, exact `toString()`, dynamic rate update when trainer status mutates.
* **Test 2 [Hidden] (Single Month Notation):** `months = 1` prints `1 months`.
* **Test 3 [Hidden] (Zero Base Rate):** Free membership with trainer package returns `$40.00/mo`.
* **Test 4 [Hidden] (Dynamic Shared State):** Modifying member externally updates contract without contract setters.
* **Test 5 [Hidden] (Private Encapsulation):** All fields confirmed `private`.

---

## Q7: Robust Grade Percentage (12 Points) - *Input Validation & Exception Loops*
Write a program in `Main.java`:

Ask `Enter grade: ` until the user enters a whole number from `0` to `100` inclusive.
* For any input that cannot be parsed as an integer, print `Invalid number.`.
* For any integer outside `0` to `100`, print `Percent out of range.`.
* When accepted, print `Grade: ` followed by the number, then on the next line print `Tries: ` followed by the total attempt count.
* Every prompt counts as one attempt. Never crash.

### Sample
```
Enter grade: [ninety]
Invalid number.
Enter grade: [105]
Percent out of range.
Enter grade: [88]
Grade: 88
Tries: 3
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** String rejection, >100 rejection, valid 88, 3 tries.
* **Test 2 [Hidden] (Overflow Int Input):** `9999999999999` prints `Invalid number.` without crashing.
* **Test 3 [Hidden] (Inclusive Limits 0 and 100):** Both accepted on first attempt.
* **Test 4 [Hidden] (Off-by-One Limits -1 and 101):** Both print `Percent out of range.`.
* **Test 5 [Hidden] (Blank Line Input):** Hitting enter on empty line prints `Invalid number.`.

---

## Q8: Calorie Counter (12 Points) - *File Processing & Summary*
`calories.txt` holds daily calorie counts per line: a positive whole number. Read the file and write `calorie_summary.txt` with these four lines:

```
Days: <total entries>
Average: <average with exactly 2 decimal places>
Lowest: <minimum value>
Over budget: <number of days strictly greater than 2000>
```

If `calories.txt` cannot be opened or does not exist, print `Cannot open calories.txt.` to the screen, write no report file, and terminate without crashing.

### Sample
`calories.txt`:
```
2100
1850
2400
1900
```
`calorie_summary.txt`:
```
Days: 4
Average: 2062.50
Lowest: 1850
Over budget: 2
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 4 days, 2062.50 average, lowest 1850, 2 days strictly > 2000.
* **Test 2 [Hidden] (Missing File Clean Failure):** Prints `Cannot open calories.txt.`, creates no file.
* **Test 3 [Hidden] (Exact 2000 Calorie Threshold):** 2000 calories is not over budget.
* **Test 4 [Hidden] (Trailing Blank Lines):** Empty lines at end of file do not corrupt count or average.
* **Test 5 [Hidden] (Single Day Entry):** Single entry file produces matching lowest and average.

---

## Q9: Team Lead Developer (12 Points) - *Inheritance & Super Delegation*
`Developer.java` is given: `Developer(String name, double salary)` with `getName()`, `getSalary()`, `double compensation(double bonus)` (salary + bonus), and `toString()` returning `<name> ($<salary formatted to 1 decimal>)`. It has no zero-argument constructor. Do not edit `Developer.java`.

Write `TeamLead.java`: a team lead **is a** `Developer` with a team size stipend.
* `TeamLead(String name, double salary, int teamSize)`.
* `getTeamSize()` returns the team size.
* `compensation(double bonus)`: calls `super.compensation(bonus)` and additionally adds `$250.0 * teamSize`.
* `toString()` returns the developer description followed by ` [Team Lead]`.
* Overrides **must** call `super.compensation(...)` and `super.toString()`. All new fields must be private.

### Sample
```java
TeamLead lead = new TeamLead("Grace", 95000.0, 4);
lead.getName();              // -> "Grace"
lead.compensation(5000.0);   // 95000 + 5000 + 4 * 250 -> 101000.0
lead.toString();             // -> "Grace ($95000.0) [Team Lead]"
Developer dev = lead;
dev.compensation(5000.0);    // -> 101000.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Super constructor, compensation with team stipend, `toString()` appending ` [Team Lead]`, polymorphic dispatch.
* **Test 2 [Hidden] (Parent Recompilation Test):** Grader replaces `Developer.java` with a version that adds taxes to compensation; failure to call `super.compensation(...)` fails test.
* **Test 3 [Hidden] (Zero Team Size):** Team size 0 adds no extra stipend.
* **Test 4 [Hidden] (Private Field Check):** All new fields private.

---

## Q10: Campus Building Directory (12 Points) - *instanceof & Downcasting*
`Building.java`, `LabBuilding.java`, and `ResidenceHall.java` are given and read-only:
* `Building(String name)` with `getName()`.
* `LabBuilding extends Building`: has method `int getCleanRooms()`.
* `ResidenceHall extends Building`: has method `int getBeds()`.

Write `BuildingDirectory.java` containing two static methods:
* `static String inspect(Building b)`:
  * For a `LabBuilding`, returns `Lab: ` followed by name and clean rooms (e.g. `Lab: Lawson (4 cleanrooms)`).
  * For a `ResidenceHall`, returns `Dorm: ` followed by name and bed capacity (e.g. `Dorm: Cary (1200 beds)`).
  * For any other `Building`, returns `Building: ` followed by name.
  * If `b` is `null`, return `"Unknown"`.
* `static int countLabs(Building[] campus)`: returns how many elements are instances of `LabBuilding`. Safely skips `null` elements.

### Sample
```java
Building b1 = new LabBuilding("Lawson", 4);
Building b2 = new ResidenceHall("Cary", 1200);
Building b3 = new Building("Purdue Memorial Union");
BuildingDirectory.inspect(b1); // -> "Lab: Lawson (4 cleanrooms)"
BuildingDirectory.inspect(b2); // -> "Dorm: Cary (1200 beds)"
BuildingDirectory.inspect(b3); // -> "Building: Purdue Memorial Union"
BuildingDirectory.countLabs(new Building[] { b1, b2, b3 }); // -> 1
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Inspects LabBuilding, ResidenceHall, base Building; counts 1 lab.
* **Test 2 [Hidden] (Null Safety Checks):** `inspect(null)` returns `"Unknown"`; `countLabs(new Building[]{null, b1, null})` returns `1`.
* **Test 3 [Hidden] (Unseen Building Subclass):** Subclass `DiningHall extends Building` returns `Building: <name>`.
* **Test 4 [Hidden] (Subclass of LabBuilding):** Subclass `NanotechLab extends LabBuilding` counted as a `LabBuilding`.
* **Test 5 [Hidden] (Empty Array):** `new Building[0]` returns `0`.

---

# Practice Exam 4

## Q1: Secret Key Token (6 Points) - *File I/O*
Write a program in `Main.java` that creates `token.dat` holding exactly these four lines:

```
TOKEN_TYPE=BEARER
KEY_ID=sec-9901
EXPIRES_IN=3600
STATUS=ACTIVE
```

Each line ends with a line break. If `token.dat` exists, replace its contents. Prints nothing to the screen.

### Sample
After running, `token.dat` holds the four lines above and nothing else.

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** File `token.dat` exists with exact lines.
* **Test 2 [Hidden] (Clean Overwrite):** Overwrites previous content cleanly.
* **Test 3 [Hidden] (Console Silence):** No console output.
* **Test 4 [Hidden] (Terminal Line Break):** Validates all lines end with newline.

---

## Q2: EV Charger (8 Points) - *Classes & Static Fields*
Implement `EVCharger` in `EVCharger.java`; fields must be private.

* A charger knows its station ID (`String`) and output in kilowatts (`double`).
* `EVCharger(String stationId, double kw)` stores both fields and increments a static charger counter.
* `getStationId()` and `getKw()` return the fields; `setKw(double kw)` updates the kilowatt rating.
* `static int getActiveChargers()` returns how many `EVCharger` objects have been created.

### Sample
```java
EVCharger c1 = new EVCharger("STATION-A", 50.0);
EVCharger c2 = new EVCharger("STATION-B", 150.0);
c1.getStationId();                 // -> "STATION-A"
c1.getKw();                        // -> 50.0
EVCharger.getActiveChargers();     // -> 2
c1.setKw(75.0);
c1.getKw();                        // -> 75.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 2 instances created, getters, setter, static count check.
* **Test 2 [Hidden] (Pre-Instantiation Counter):** `getActiveChargers()` returns 0 initially.
* **Test 3 [Hidden] (Encapsulation):** All fields confirmed `private`.
* **Test 4 [Hidden] (Zero KW):** 0.0 kW updates cleanly.
* **Test 5 [Hidden] (Null Station ID):** Null station ID handled safely.

---

## Q3: Camera Shutter Speed (8 Points) - *Encapsulation & Bounds*
Write the class `CameraExposure` in `CameraExposure.java`; fields must be private.

* Exposure index is an integer step from `1` (fastest shutter) to `15` (longest exposure) inclusive.
* `setStep(int step)` stores the value only if it is in `[1, 15]`; an out-of-range value changes nothing.
* The constructor `CameraExposure(int step)` sends its argument through `setStep`. A bad starting value defaults step to `8`.
* `getStep()` returns the current step.
* `increaseExposure()` raises step by 1 unless it is already 15 (clamped).
* `decreaseExposure()` lowers step by 1 unless it is already 1 (clamped).

### Sample
```java
CameraExposure exp = new CameraExposure(14);
exp.increaseExposure();
exp.getStep();             // -> 15
exp.increaseExposure();
exp.getStep();             // -> 15
exp.setStep(20);
exp.getStep();             // -> 15
new CameraExposure(0).getStep(); // -> 8
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Increases to 15, capped at 15, out-of-range rejected, bad constructor defaults to 8.
* **Test 2 [Hidden] (Decrease Clamping at 1):** Repeatedly decreasing past 1 stays at 1.
* **Test 3 [Hidden] (Exact Boundaries):** Setting step to 1 and 15 succeeds.
* **Test 4 [Hidden] (Off-by-One Rejection):** Step 0 and 16 rejected.
* **Test 5 [Hidden] (Constructor Valid Extremes):** `new CameraExposure(1)` gives 1; `new CameraExposure(15)` gives 15.

---

## Q4: Cloud Infrastructure Billing (10 Points) - *Interfaces & Polymorphism*
Files given (read-only):
* `CloudResource.java`: interface with `String resourceId()` and `double monthlyCost()`. `monthlyCost()` can be negative (promotional cloud credits).
* `VirtualServer.java` and `DatabaseCluster.java` implementing `CloudResource`.
* `Main.java`: testing driver.

Write `CloudAccount.java` containing two static methods:
* `static double totalCost(CloudResource[] resources)`: returns the sum of every `monthlyCost()`.
* `static String priciestResource(CloudResource[] resources)`: returns the `resourceId()` of the element with the largest `monthlyCost()`.
  * **Tie Rule:** On a tie, the first one encountered wins.
  * **Empty Rule:** An empty array gives `0.0` and `""`.
  * **Null Safety:** Safely skip any `null` elements in `resources`.

### Sample
```java
CloudResource[] cloud = { new VirtualServer("srv-web-01"), new DatabaseCluster("db-main") };
// srv-web-01 cost is 45.0; db-main cost is 320.0
CloudAccount.totalCost(cloud);         // -> 365.0
CloudAccount.priciestResource(cloud);  // -> "db-main"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Sums cloud resource costs and finds priciest resource ID.
* **Test 2 [Hidden] (Promotional Credits Negative Max):** All resources negative returns the least negative resource.
* **Test 3 [Hidden] (Array with Nulls):** Sum and priciest work on array containing `null`.
* **Test 4 [Hidden] (Exact Cost Tie):** First resource encountered in tie wins.
* **Test 5 [Hidden] (Empty Array):** Returns `0.0` and `""`.

---

## Q5: Course Workshop Enrollment Overloading (10 Points) - *Overloading & Constructor Chaining*
Create `Workshop` in `Workshop.java` with private fields: `String topic`, `int seats`, and `boolean certificateOffered`.

Implement constructor and method overloading:
* `Workshop(String topic, int seats, boolean certificateOffered)`: initializes all fields.
* `Workshop(String topic, int seats)`: overloads constructor, defaulting `certificateOffered` to `true` (chain using `this(...)`).
* `Workshop(String topic)`: overloads constructor, defaulting `seats` to `25` and `certificateOffered` to `true` (chain using `this(...)`).
* `getTopic()`, `getSeats()`, and `isCertificateOffered()` return the fields.
* `tuitionRevenue(double baseSeatPrice)`: revenue is `seats * baseSeatPrice`. If `certificateOffered` is true, add a `$20.00` credential fee per seat (`seats * 20.0`).
* `tuitionRevenue(double baseSeatPrice, double earlyBirdDiscountPerSeat)`: overloads `tuitionRevenue` by deducting `earlyBirdDiscountPerSeat` from each seat's base price before calculating. Net seat price cannot drop below `0.0`.
  * If `earlyBirdDiscountPerSeat < 0.0`, treat it as `0.0`.

### Sample
```java
Workshop w1 = new Workshop("Machine Learning", 10, true);
Workshop w2 = new Workshop("Python Scripting");
w1.tuitionRevenue(100.0);        // 10 * 100 + 10 * 20 -> 1200.0
w1.tuitionRevenue(100.0, 30.0);  // 10 * (100 - 30) + 10 * 20 -> 900.0
w2.getSeats();                   // -> 25
w2.isCertificateOffered();       // -> true
w2.tuitionRevenue(10.0, 50.0);   // base price clamped to 0 -> 25 * 0 + 25 * 20 -> 500.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Certificate surcharge, early bird discount overload, 1-arg defaults, base price discount clamp.
* **Test 2 [Hidden] (Negative Discount Trap):** Discount `-20.0` treated as `0.0`.
* **Test 3 [Hidden] (Base Price Clamping with Certificate):** Discount exceeding base price clamps seat base to `0.0`, but certificate fee remains (`seats * 20.0`).
* **Test 4 [Hidden] (Constructor Delegation):** Verified chaining via `this(...)`.
* **Test 5 [Hidden] (Zero Seats):** 0 seats yields `0.0` revenue.

---

## Q6: Warehouse Storage Bin (10 Points) - *Composition & Dynamic Delegation*
`Item.java` is given: `Item(String sku, boolean fragile)` with `getSku()`, `isFragile()`, and `setFragile(boolean fragile)`. Do not edit `Item.java`.

Implement `StorageBin.java`; all fields must be private:
* `StorageBin(Item item, int quantity, double unitValue)` stores all three fields.
* `getItem()` and `getQuantity()` return the fields; `setQuantity(int quantity)` updates quantity.
* `totalValue()`: `quantity * unitValue`. If `item.isFragile()` is true, add a handling insurance surcharge of `15%` to total value (multiply by `1.15`).
  * Checks `item.isFragile()` **dynamically every time** `totalValue()` is called.
* `toString()` returns: `Bin[<sku>, <quantity> items, $<totalValue formatted to 2 decimals>]`. Use `items` even for quantity 1.

### Sample
```java
Item it = new Item("SKU-102", true);
StorageBin bin = new StorageBin(it, 5, 20.0);
bin.totalValue();   // 5 * 20 * 1.15 -> 115.0
bin.toString();     // -> "Bin[SKU-102, 5 items, $115.00]"
it.setFragile(false);
bin.totalValue();   // 5 * 20 -> 100.0
bin.toString();     // -> "Bin[SKU-102, 5 items, $100.00]"
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 15% fragile surcharge, exact `toString()`, dynamic value update when item fragility changes.
* **Test 2 [Hidden] (Grammatical Check):** `quantity = 1` outputs `1 items`.
* **Test 3 [Hidden] (Dynamic Mutation Reflection):** Modifying item fragility externally reflects immediately in `bin.toString()`.
* **Test 4 [Hidden] (Zero Quantity):** Quantity 0 outputs `$0.00`.
* **Test 5 [Hidden] (Private Encapsulation):** All fields confirmed `private`.

---

## Q7: Robust Battery Capacity (12 Points) - *Input Validation & Exception Loops*
Write a program in `Main.java`:

Ask `Enter capacity: ` until the user enters a whole number from `100` to `5000` inclusive.
* For any input that cannot be parsed as an integer, print `Not a whole number.`.
* For any integer outside `100` to `5000`, print `Capacity out of range.`.
* When accepted, print `Capacity: ` followed by the number, then on the next line print `Prompts: ` followed by total prompt count.
* Every prompt counts as one attempt. Never crash.

### Sample
```
Enter capacity: [fast]
Not a whole number.
Enter capacity: [50]
Capacity out of range.
Enter capacity: [3200]
Capacity: 3200
Prompts: 3
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Non-number, out of range low, valid 3200, 3 prompts.
* **Test 2 [Hidden] (Gigantic Integer Overflow):** Huge input string prints `Not a whole number.` without crash.
* **Test 3 [Hidden] (Exact Boundaries):** `100` and `5000` accepted on prompt 1.
* **Test 4 [Hidden] (Off-by-One Boundaries):** `99` and `5001` print `Capacity out of range.`.
* **Test 5 [Hidden] (Negative Capacity):** `-500` prints `Capacity out of range.`.

---

## Q8: Vehicle Highway Speed Tracker (12 Points) - *File Processing & Summary*
`speeds.txt` holds radar vehicle speeds in MPH per line: a positive whole number. Read the file and write `speed_report.txt` with these four lines:

```
Vehicles: <total lines>
Average: <average with exactly 2 decimal places>
Fastest: <maximum value>
Speeders: <number of vehicles strictly greater than 70>
```

If `speeds.txt` cannot be opened or does not exist, print `Cannot open speeds.txt.` to the screen, write no report file, and terminate without crashing.

### Sample
`speeds.txt`:
```
65
72
80
68
70
```
`speed_report.txt`:
```
Vehicles: 5
Average: 71.00
Fastest: 80
Speeders: 2
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** 5 lines, 71.00 avg, max 80, 2 speeders strictly > 70.
* **Test 2 [Hidden] (Missing File Clean Failure):** Prints `Cannot open speeds.txt.`, creates no file.
* **Test 3 [Hidden] (Exact 70 Limit):** Speed 70 is not a speeder.
* **Test 4 [Hidden] (Trailing Newlines):** Extra newlines at EOF do not inflate count.
* **Test 5 [Hidden] (Single Vehicle Entry):** Single vehicle processed accurately.

---

## Q9: Senior Research Scientist (12 Points) - *Inheritance & Super Delegation*
`Researcher.java` is given: `Researcher(String name, double baseGrant)` with `getName()`, `getBaseGrant()`, `double funding(double match)` (baseGrant + match), and `toString()` returning `Researcher <name> ($<baseGrant formatted to 1 decimal>)`. It has no zero-argument constructor. Do not edit `Researcher.java`.

Write `PrincipalInvestigator.java`: a principal investigator **is a** `Researcher` with institutional lab overhead.
* `PrincipalInvestigator(String name, double baseGrant, double labOverhead)`.
* `getLabOverhead()` returns the lab overhead.
* `funding(double match)`: calls `super.funding(match)` and adds `labOverhead` once.
* `toString()` returns the parent's `toString()` followed by ` {PI}` (e.g. `Researcher Marie ($50000.0) {PI}`).
* Overrides **must** call `super.funding(...)` and `super.toString()`. All new fields must be private.

### Sample
```java
PrincipalInvestigator pi = new PrincipalInvestigator("Marie", 50000.0, 15000.0);
pi.getName();              // -> "Marie"
pi.funding(5000.0);        // 50000 + 5000 + 15000 -> 70000.0
pi.toString();             // -> "Researcher Marie ($50000.0) {PI}"
Researcher r = pi;
r.funding(5000.0);         // -> 70000.0
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Super constructor, funding with overhead, `toString()` appending ` {PI}`, polymorphic call.
* **Test 2 [Hidden] (Parent Recompilation Test):** Recompiling against an updated parent class tests that `super.funding(...)` is called.
* **Test 3 [Hidden] (Parent toString Call):** Calling `super.toString()` confirmed.
* **Test 4 [Hidden] (Zero Overhead):** Overhead of 0.0 adds nothing extra.
* **Test 5 [Hidden] (Private Field Check):** New instance fields private.

---

## Q10: Telemetry Station Classifier (12 Points) - *instanceof & Downcasting*
`Station.java`, `OpticalStation.java`, and `RadarStation.java` are given and read-only:
* `Station(String siteName)` with `getSiteName()`.
* `OpticalStation extends Station`: has method `double getApertureMeters()`.
* `RadarStation extends Station`: has method `int getFrequencyGHz()`.

Write `StationClassifier.java` containing two static methods:
* `static String inspect(Station s)`:
  * For an `OpticalStation`, returns `Optical: ` followed by site name and aperture (e.g. `Optical: Maui (3.6m)`).
  * For a `RadarStation`, returns `Radar: ` followed by site name and frequency (e.g. `Radar: Haystack (10 GHz)`).
  * For any other `Station`, returns `Station: ` followed by site name.
  * If `s` is `null`, return `"Offline"`.
* `static int countRadars(Station[] network)`: returns how many elements in the array are instances of `RadarStation`. Safely ignores `null` elements.

### Sample
```java
Station s1 = new OpticalStation("Maui", 3.6);
Station s2 = new RadarStation("Haystack", 10);
Station s3 = new Station("Canberra");
StationClassifier.inspect(s1); // -> "Optical: Maui (3.6m)"
StationClassifier.inspect(s2); // -> "Radar: Haystack (10 GHz)"
StationClassifier.inspect(s3); // -> "Station: Canberra"
StationClassifier.countRadars(new Station[] { s1, s2, s3 }); // -> 1
```

### Test Cases & Hard-to-See Edge Cases
* **Test 1 [Visible] (Sample Run):** Inspects OpticalStation, RadarStation, base Station; counts 1 radar.
* **Test 2 [Hidden] (Null Safety Checks):** `inspect(null)` returns `"Offline"`; `countRadars(new Station[]{null, s2, null})` returns `1`.
* **Test 3 [Hidden] (Unseen Station Subclass):** Subclass `DeepSpaceArray extends Station` returns `Station: <siteName>`.
* **Test 4 [Hidden] (Subclass of RadarStation):** Subclass `PhasedArrayRadar extends RadarStation` correctly identified as a `RadarStation`.
* **Test 5 [Hidden] (Empty Array):** `new Station[0]` returns `0`.
