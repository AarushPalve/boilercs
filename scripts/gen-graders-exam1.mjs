// Adds `graderCases` to Practice Exam 1 questions. Each case body uses the
// harness helpers: check(cond,msg), eq(actual,expected), eqD(actual,expected).
// Hand-authored from each question's spec/test descriptions.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const path = join(process.cwd(), 'public', 'data', 'exams', 'practice-exam-1.json');
const exam = JSON.parse(readFileSync(path, 'utf8'));

const G = {
  'q1-flight-ticket': [
    { name: 'Sample run (2-arg defaults + clamps)', hidden: false,
      body: 'FlightTicket t = new FlightTicket("Amelia Earhart","AA180");\neq(t.getSeatRow(), 30);\neqD(t.getBaseFare(), 199.99);\nt.setSeatRow(55); eq(t.getSeatRow(), 40);\nt.setBaseFare(-50.0); eqD(t.getBaseFare(), 0.0);' },
    { name: 'Lower row clamp', hidden: true,
      body: 'FlightTicket t = new FlightTicket("A","B");\nt.setSeatRow(0); eq(t.getSeatRow(),1);\nt.setSeatRow(-5); eq(t.getSeatRow(),1);' },
    { name: 'Row boundaries 1 and 40', hidden: true,
      body: 'FlightTicket t = new FlightTicket("A","B");\nt.setSeatRow(1); eq(t.getSeatRow(),1);\nt.setSeatRow(40); eq(t.getSeatRow(),40);' },
    { name: '4-arg constructor preserves fields', hidden: true,
      body: 'FlightTicket t = new FlightTicket("Neil Armstrong","UA202",12,349.50);\neq(t.getPassengerName(),"Neil Armstrong");\neq(t.getFlightNumber(),"UA202");\neq(t.getSeatRow(),12);\neqD(t.getBaseFare(),349.50);' },
    { name: 'Zero fare allowed', hidden: true,
      body: 'FlightTicket t = new FlightTicket("A","B");\nt.setBaseFare(0.0); eqD(t.getBaseFare(),0.0);' },
    { name: 'String setters', hidden: true,
      body: 'FlightTicket t = new FlightTicket("A","B");\nt.setPassengerName("Zoe"); eq(t.getPassengerName(),"Zoe");\nt.setFlightNumber("DL9"); eq(t.getFlightNumber(),"DL9");' },
  ],

  'q2-smart-thermostat': [
    { name: 'Sample run (format + case-insensitive equals)', hidden: false,
      body: 'Thermostat t1 = new Thermostat("NEST-001","Living Room",72.45);\nThermostat t2 = new Thermostat("nest-001","Basement",68.0);\neq(t1.toString(),"Device: NEST-001\\nRoom: Living Room\\nTemp: 72.5 F");\ncheck(t1.equals(t2), "case-insensitive id should match");' },
    { name: 'equals(null) is false', hidden: true,
      body: 'Thermostat t = new Thermostat("X","R",1.0);\ncheck(!t.equals(null), "equals(null) must be false");' },
    { name: 'equals(other type) is false', hidden: true,
      body: 'Thermostat t = new Thermostat("X","R",1.0);\ncheck(!t.equals("X"), "equals(String) must be false");' },
    { name: 'Different id not equal', hidden: true,
      body: 'Thermostat a = new Thermostat("A1","R",1.0);\nThermostat b = new Thermostat("B2","R",1.0);\ncheck(!a.equals(b), "different ids must not be equal");' },
    { name: 'Rounding 69.99 -> 70.0', hidden: true,
      body: 'Thermostat t = new Thermostat("X","R",69.99);\ncheck(t.toString().contains("70.0 F"), "should round to 70.0 F");' },
    { name: 'Trailing zero 68.0 F', hidden: true,
      body: 'Thermostat t = new Thermostat("X","R",68.0);\ncheck(t.toString().contains("68.0 F"), "should show 68.0 F");' },
  ],

  'q3-bank-transaction-validator': [
    { name: 'Sample run (valid then overdraft)', hidden: false,
      body: 'double rem = AccountValidator.processWithdrawal(100.0,40.0);\neqD(rem,60.0);\ntry { AccountValidator.processWithdrawal(rem,75.0); check(false,"should throw"); }\ncatch (InsufficientFundsException e) { eq(e.getMessage(),"Overdraft prevented: balance is 60.0, withdrawal requested is 75.0"); }' },
    { name: 'Exact balance withdrawal', hidden: true,
      body: 'eqD(AccountValidator.processWithdrawal(50.0,50.0), 0.0);' },
    { name: 'Zero amount throws IllegalArgumentException', hidden: true,
      body: 'try { AccountValidator.processWithdrawal(100.0,0.0); check(false,"should throw"); }\ncatch (IllegalArgumentException e) { eq(e.getMessage(),"Withdrawal amount must be positive"); }' },
    { name: 'Negative amount throws IllegalArgumentException', hidden: true,
      body: 'try { AccountValidator.processWithdrawal(100.0,-15.0); check(false,"should throw"); }\ncatch (IllegalArgumentException e) {}' },
    { name: 'InsufficientFundsException is checked', hidden: true,
      body: 'check(Exception.class.isAssignableFrom(InsufficientFundsException.class) && !RuntimeException.class.isAssignableFrom(InsufficientFundsException.class), "must extend Exception, not RuntimeException");' },
    { name: 'Penny overdraft throws', hidden: true,
      body: 'try { AccountValidator.processWithdrawal(50.00,50.01); check(false,"should throw"); }\ncatch (InsufficientFundsException e) {}' },
  ],

  'q4-renewable-power-source': [
    { name: 'Sample run (daily/annual/target)', hidden: false,
      body: 'SolarPanel p = new SolarPanel(400.0,5.0);\neqD(p.getDailyKWh(),2.0);\neqD(p.getAnnualKWh(),730.0);\ncheck(p.meetsTarget(700.0), "730 should meet 700");' },
    { name: 'Exact annual boundary', hidden: true,
      body: 'SolarPanel p = new SolarPanel(400.0,5.0);\ncheck(p.meetsTarget(730.0), "equal should meet target");' },
    { name: 'Fails higher target', hidden: true,
      body: 'SolarPanel p = new SolarPanel(400.0,5.0);\ncheck(!p.meetsTarget(800.0), "730 must not meet 800");' },
    { name: 'Negative sun hours -> 0', hidden: true,
      body: 'SolarPanel p = new SolarPanel(400.0,-2.0);\neqD(p.getDailyKWh(),0.0);\neqD(p.getAnnualKWh(),0.0);' },
    { name: 'Negative wattage -> 0', hidden: true,
      body: 'SolarPanel p = new SolarPanel(-100.0,5.0);\neqD(p.getDailyKWh(),0.0);' },
    { name: 'Polymorphic reference', hidden: true,
      body: 'RenewableSource r = new SolarPanel(300,4);\neqD(r.getDailyKWh(),1.2);\neqD(r.getAnnualKWh(),438.0);' },
  ],

  'q5-hospital-personnel': [
    { name: 'Sample run (regular/overtime/night)', hidden: false,
      body: 'Employee e = new Employee("Greg",30.0);\nNurse n1 = new Nurse("Clara",30.0,false);\nNurse n2 = new Nurse("Dan",30.0,true);\neqD(e.calculateWeeklyPay(45),1350.0);\neqD(n1.calculateWeeklyPay(45),1425.0);\neqD(n2.calculateWeeklyPay(45),1575.0);' },
    { name: 'Exact 40 hours, no overtime', hidden: true,
      body: 'Nurse n = new Nurse("A",30.0,false);\neqD(n.calculateWeeklyPay(40),1200.0);' },
    { name: 'Under 40 with night shift', hidden: true,
      body: 'Nurse n = new Nurse("A",30.0,true);\neqD(n.calculateWeeklyPay(30),1050.0);' },
    { name: 'Zero hours night shift = differential only', hidden: true,
      body: 'Nurse n = new Nurse("A",30.0,true);\neqD(n.calculateWeeklyPay(0),150.0);' },
    { name: 'Zero hours day shift = 0', hidden: true,
      body: 'Nurse n = new Nurse("A",30.0,false);\neqD(n.calculateWeeklyPay(0),0.0);' },
    { name: 'Polymorphic dispatch', hidden: true,
      body: 'Employee emp = new Nurse("Alex",20.0,true);\neqD(emp.calculateWeeklyPay(0),150.0);' },
  ],

  'q9-musical-instrument-hierarchy': [
    { name: 'Sample run (brass/penalty/woodwind cap)', hidden: false,
      body: 'Instrument trumpet = new Brass("Trumpet",60);\nInstrument flute = new Woodwind("Flute",50);\neq(trumpet.playNote(8),92);\neq(trumpet.playNote(12),123);\neq(flute.playNote(30),95);' },
    { name: 'Intensity 10 brass, no penalty', hidden: true,
      body: 'Instrument t = new Brass("T",60);\neq(t.playNote(10),100);' },
    { name: 'Intensity 11 brass penalty', hidden: true,
      body: 'Instrument t = new Brass("T",60);\neq(t.playNote(11),119);' },
    { name: 'Woodwind under cap', hidden: true,
      body: 'Instrument f = new Woodwind("F",50);\neq(f.playNote(5),60);' },
    { name: 'Zero intensity = base', hidden: true,
      body: 'eq(new Brass("B",60).playNote(0),60);\neq(new Woodwind("W",50).playNote(0),50);' },
    { name: 'Super constructor', hidden: true,
      body: 'Instrument t = new Brass("Trumpet",60);\ncheck(t instanceof Instrument, "Brass must extend Instrument");' },
  ],
};

let n = 0;
for (const q of exam.questions) {
  if (G[q.id]) {
    q.graderCases = G[q.id];
    n++;
  }
}
writeFileSync(path, JSON.stringify(exam, null, 2) + '\n', 'utf8');
console.log('added graderCases to', n, 'questions in practice-exam-1.json');
