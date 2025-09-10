import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Camera, 
  Save, 
  Shield, 
  Bell, 
  Mail,
  Smartphone,
  Globe,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  CheckCircle
} from "lucide-react";

export default function ProfileSettings() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    website: "https://johndoe.dev",
    location: "United States",
    country: "United States",
    jobTitle: "Senior Software Engineer",
    company: "Tech Corp",
    industry: "Technology",
    experience: "5-10 years",
    education: "Bachelor's Degree",
    timezone: "Los Angeles (PST)",
    language: "English",
    currentPackage: "Pro Plan",
    storageUsed: "2.4 GB",
    storageLimit: "100 GB"
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true,
    security: true,
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    showEmail: false,
    showPhone: false,
  });

  const handleProfileSave = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    }, 1000);
  };

  const handleQuickUpdate = (field: string, value: string) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset timezone when country changes
      if (field === 'country') {
        const cities = getCitiesByCountry(value);
        updated.timezone = cities.length > 0 ? cities[0] : "Select a city";
      }
      
      return updated;
    });
    
    toast({
      title: "Updated",
      description: `${field} has been updated`,
    });
  };

  const getCitiesByCountry = (country: string) => {
    const cityMap: { [key: string]: string[] } = {
      "United States": [
        "Los Angeles (PST)",
        "Denver (MST)", 
        "Chicago (CST)",
        "New York (EST)",
        "Miami (EST)",
        "Seattle (PST)",
        "San Francisco (PST)",
        "Boston (EST)",
        "Atlanta (EST)",
        "Dallas (CST)"
      ],
      "Canada": [
        "Vancouver (PST)",
        "Calgary (MST)",
        "Winnipeg (CST)",
        "Toronto (EST)",
        "Montreal (EST)",
        "Halifax (AST)",
        "St. John's (NST)"
      ],
      "United Kingdom": [
        "London (GMT)",
        "Manchester (GMT)",
        "Birmingham (GMT)",
        "Edinburgh (GMT)",
        "Glasgow (GMT)",
        "Belfast (GMT)"
      ],
      "Germany": [
        "Berlin (CET)",
        "Munich (CET)",
        "Hamburg (CET)",
        "Frankfurt (CET)",
        "Cologne (CET)",
        "Stuttgart (CET)"
      ],
      "France": [
        "Paris (CET)",
        "Lyon (CET)",
        "Marseille (CET)",
        "Toulouse (CET)",
        "Nice (CET)",
        "Nantes (CET)"
      ],
      "Spain": [
        "Madrid (CET)",
        "Barcelona (CET)",
        "Valencia (CET)",
        "Seville (CET)",
        "Bilbao (CET)",
        "Malaga (CET)"
      ],
      "Italy": [
        "Rome (CET)",
        "Milan (CET)",
        "Naples (CET)",
        "Turin (CET)",
        "Florence (CET)",
        "Venice (CET)"
      ],
      "Netherlands": [
        "Amsterdam (CET)",
        "Rotterdam (CET)",
        "The Hague (CET)",
        "Utrecht (CET)",
        "Eindhoven (CET)"
      ],
      "Sweden": [
        "Stockholm (CET)",
        "Gothenburg (CET)",
        "Malmo (CET)",
        "Uppsala (CET)"
      ],
      "Norway": [
        "Oslo (CET)",
        "Bergen (CET)",
        "Trondheim (CET)",
        "Stavanger (CET)"
      ],
      "Denmark": [
        "Copenhagen (CET)",
        "Aarhus (CET)",
        "Odense (CET)"
      ],
      "Finland": [
        "Helsinki (EET)",
        "Tampere (EET)",
        "Turku (EET)"
      ],
      "Switzerland": [
        "Zurich (CET)",
        "Geneva (CET)",
        "Basel (CET)",
        "Bern (CET)"
      ],
      "Austria": [
        "Vienna (CET)",
        "Salzburg (CET)",
        "Graz (CET)",
        "Innsbruck (CET)"
      ],
      "Belgium": [
        "Brussels (CET)",
        "Antwerp (CET)",
        "Ghent (CET)",
        "Bruges (CET)"
      ],
      "Ireland": [
        "Dublin (GMT)",
        "Cork (GMT)",
        "Galway (GMT)"
      ],
      "Portugal": [
        "Lisbon (WET)",
        "Porto (WET)",
        "Coimbra (WET)"
      ],
      "Poland": [
        "Warsaw (CET)",
        "Krakow (CET)",
        "Gdansk (CET)",
        "Wroclaw (CET)"
      ],
      "Czech Republic": [
        "Prague (CET)",
        "Brno (CET)",
        "Ostrava (CET)"
      ],
      "Hungary": [
        "Budapest (CET)",
        "Debrecen (CET)",
        "Szeged (CET)"
      ],
      "Australia": [
        "Sydney (AEST)",
        "Melbourne (AEST)",
        "Brisbane (AEST)",
        "Perth (AWST)",
        "Adelaide (ACST)",
        "Darwin (ACST)"
      ],
      "New Zealand": [
        "Auckland (NZST)",
        "Wellington (NZST)",
        "Christchurch (NZST)"
      ],
      "Japan": [
        "Tokyo (JST)",
        "Osaka (JST)",
        "Kyoto (JST)",
        "Yokohama (JST)",
        "Nagoya (JST)"
      ],
      "South Korea": [
        "Seoul (KST)",
        "Busan (KST)",
        "Incheon (KST)",
        "Daegu (KST)"
      ],
      "China": [
        "Beijing (CST)",
        "Shanghai (CST)",
        "Guangzhou (CST)",
        "Shenzhen (CST)",
        "Chengdu (CST)"
      ],
      "India": [
        "Mumbai (IST)",
        "Delhi (IST)",
        "Bangalore (IST)",
        "Chennai (IST)",
        "Kolkata (IST)",
        "Hyderabad (IST)"
      ],
      "Singapore": [
        "Singapore (SGT)"
      ],
      "Hong Kong": [
        "Hong Kong (HKT)"
      ],
      "Taiwan": [
        "Taipei (CST)"
      ],
      "Thailand": [
        "Bangkok (ICT)",
        "Chiang Mai (ICT)",
        "Phuket (ICT)"
      ],
      "Malaysia": [
        "Kuala Lumpur (MYT)",
        "Penang (MYT)",
        "Johor Bahru (MYT)"
      ],
      "Indonesia": [
        "Jakarta (WIB)",
        "Surabaya (WIB)",
        "Bandung (WIB)"
      ],
      "Philippines": [
        "Manila (PHT)",
        "Cebu (PHT)",
        "Davao (PHT)"
      ],
      "Vietnam": [
        "Ho Chi Minh City (ICT)",
        "Hanoi (ICT)",
        "Da Nang (ICT)"
      ],
      "Brazil": [
        "São Paulo (BRT)",
        "Rio de Janeiro (BRT)",
        "Brasília (BRT)",
        "Salvador (BRT)"
      ],
      "Argentina": [
        "Buenos Aires (ART)",
        "Córdoba (ART)",
        "Rosario (ART)"
      ],
      "Chile": [
        "Santiago (CLT)",
        "Valparaíso (CLT)"
      ],
      "Colombia": [
        "Bogotá (COT)",
        "Medellín (COT)",
        "Cali (COT)"
      ],
      "Mexico": [
        "Mexico City (CST)",
        "Guadalajara (CST)",
        "Monterrey (CST)"
      ],
      "Peru": [
        "Lima (PET)",
        "Arequipa (PET)"
      ],
      "Uruguay": [
        "Montevideo (UYT)"
      ],
      "South Africa": [
        "Cape Town (SAST)",
        "Johannesburg (SAST)",
        "Durban (SAST)"
      ],
      "Egypt": [
        "Cairo (EET)",
        "Alexandria (EET)"
      ],
      "Nigeria": [
        "Lagos (WAT)",
        "Abuja (WAT)"
      ],
      "Kenya": [
        "Nairobi (EAT)"
      ],
      "Morocco": [
        "Casablanca (WET)",
        "Rabat (WET)"
      ],
      "Israel": [
        "Tel Aviv (IST)",
        "Jerusalem (IST)"
      ],
      "Turkey": [
        "Istanbul (TRT)",
        "Ankara (TRT)"
      ],
      "Russia": [
        "Moscow (MSK)",
        "St. Petersburg (MSK)"
      ],
      "Ukraine": [
        "Kyiv (EET)"
      ]
    };
    
    return cityMap[country] || ["Select a country first"];
  };


  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Complete your profile to get the most out of CloudVault</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Profile 85% Complete
          </Badge>
          <Button onClick={handleProfileSave} disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{profile.jobTitle}</p>
                  <p className="text-xs text-muted-foreground">{profile.company}</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Package */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <Badge variant="default">{profile.currentPackage}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="text-sm font-medium">{profile.storageUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Limit</span>
                <span className="text-sm font-medium">{profile.storageLimit}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Profile Views</span>
                <Badge variant="secondary">1,234</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={profile.firstName}
                    onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={profile.lastName}
                    onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1"
                  />
                  <Badge variant="secondary" className="self-center">
                    Verified
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={profile.jobTitle}
                    onChange={(e) => setProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={profile.industry} onValueChange={(value) => handleQuickUpdate('industry', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Select value={profile.experience} onValueChange={(value) => handleQuickUpdate('experience', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1 years">0-1 years</SelectItem>
                      <SelectItem value="1-3 years">1-3 years</SelectItem>
                      <SelectItem value="3-5 years">3-5 years</SelectItem>
                      <SelectItem value="5-10 years">5-10 years</SelectItem>
                      <SelectItem value="10+ years">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Education</Label>
                <Select value={profile.education} onValueChange={(value) => handleQuickUpdate('education', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High School">High School</SelectItem>
                    <SelectItem value="Associate's Degree">Associate's Degree</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Location & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={profile.country} onValueChange={(value) => handleQuickUpdate('country', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                      <SelectItem value="Italy">Italy</SelectItem>
                      <SelectItem value="Netherlands">Netherlands</SelectItem>
                      <SelectItem value="Sweden">Sweden</SelectItem>
                      <SelectItem value="Norway">Norway</SelectItem>
                      <SelectItem value="Denmark">Denmark</SelectItem>
                      <SelectItem value="Finland">Finland</SelectItem>
                      <SelectItem value="Switzerland">Switzerland</SelectItem>
                      <SelectItem value="Austria">Austria</SelectItem>
                      <SelectItem value="Belgium">Belgium</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="Poland">Poland</SelectItem>
                      <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                      <SelectItem value="Hungary">Hungary</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="New Zealand">New Zealand</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="South Korea">South Korea</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                      <SelectItem value="Taiwan">Taiwan</SelectItem>
                      <SelectItem value="Thailand">Thailand</SelectItem>
                      <SelectItem value="Malaysia">Malaysia</SelectItem>
                      <SelectItem value="Indonesia">Indonesia</SelectItem>
                      <SelectItem value="Philippines">Philippines</SelectItem>
                      <SelectItem value="Vietnam">Vietnam</SelectItem>
                      <SelectItem value="Brazil">Brazil</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Chile">Chile</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="Peru">Peru</SelectItem>
                      <SelectItem value="Uruguay">Uruguay</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="Egypt">Egypt</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Morocco">Morocco</SelectItem>
                      <SelectItem value="Israel">Israel</SelectItem>
                      <SelectItem value="Turkey">Turkey</SelectItem>
                      <SelectItem value="Russia">Russia</SelectItem>
                      <SelectItem value="Ukraine">Ukraine</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select value={profile.timezone} onValueChange={(value) => handleQuickUpdate('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {getCitiesByCountry(profile.country).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={profile.language} onValueChange={(value) => handleQuickUpdate('language', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Italian">Italian</SelectItem>
                    <SelectItem value="Portuguese">Portuguese</SelectItem>
                    <SelectItem value="Dutch">Dutch</SelectItem>
                    <SelectItem value="Swedish">Swedish</SelectItem>
                    <SelectItem value="Norwegian">Norwegian</SelectItem>
                    <SelectItem value="Danish">Danish</SelectItem>
                    <SelectItem value="Finnish">Finnish</SelectItem>
                    <SelectItem value="Polish">Polish</SelectItem>
                    <SelectItem value="Czech">Czech</SelectItem>
                    <SelectItem value="Hungarian">Hungarian</SelectItem>
                    <SelectItem value="Russian">Russian</SelectItem>
                    <SelectItem value="Ukrainian">Ukrainian</SelectItem>
                    <SelectItem value="Chinese (Simplified)">Chinese (Simplified)</SelectItem>
                    <SelectItem value="Chinese (Traditional)">Chinese (Traditional)</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                    <SelectItem value="Korean">Korean</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Hebrew">Hebrew</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Thai">Thai</SelectItem>
                    <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                    <SelectItem value="Indonesian">Indonesian</SelectItem>
                    <SelectItem value="Malay">Malay</SelectItem>
                    <SelectItem value="Tagalog">Tagalog</SelectItem>
                    <SelectItem value="Turkish">Turkish</SelectItem>
                    <SelectItem value="Greek">Greek</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}