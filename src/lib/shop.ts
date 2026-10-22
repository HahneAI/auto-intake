// Single source of truth for business details and form options.
// Every value marked PLACEHOLDER needs confirming with the owner.

export const shop = {
  name: "Your Shop Name", // PLACEHOLDER
  tagline: "Mobile mechanic. Tell me what your car is doing and where it is, and I'll come to you.",
  phone: "(555) 555-5555", // PLACEHOLDER
  responseTime: "Usually within a few hours during business hours", // PLACEHOLDER
  city: "Your City", // PLACEHOLDER
};

export const symptomOptions = [
  "Warning light",
  "Strange noise",
  "Won't start",
  "Leak",
  "Brakes",
  "Steering / suspension",
  "Overheating",
  "A/C or heat",
  "Electrical",
  "Other",
] as const;

export const whenOptions = [
  "Starting up",
  "Idling",
  "Accelerating",
  "Braking",
  "Turning",
  "Highway speed",
  "All the time",
] as const;

export const drivableOptions = ["Yes", "Not sure", "No, needs a tow"] as const;

export const contactOptions = ["Text", "Call", "Email"] as const;

export type IntakeSubmission = {
  vin: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  symptoms: string[];
  when: string[];
  drivable: string;
  description: string;
  name: string;
  phone: string;
  email: string;
  contactPref: string;
  location: string;
  availability: string;
};
