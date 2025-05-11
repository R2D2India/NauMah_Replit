import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Initialize i18next with all the options
i18n
  // load translations using http (default public/locales)
  .use(Backend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    // Backend configuration for loading translations
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    resources: {
      en: {
        translation: {
          app: {
            title: "NauMah",
            slogan: "Your Intelligent Companion for Every Stage of Pregnancy",
            companion: "Your AI Pregnancy Companion"
          },
          navigation: {
            home: "Home",
            dashboard: "Baby & Me",
            tracker: "Tracker",
            journal: "Journal",
            diet: "Diet & Exercise",
            resources: "Resources",
            support: "Support",
            login: "Login",
            register: "Register",
            logout: "Logout",
            profile: "Profile"
          },
          hero: {
            subtitle: "Navigate your pregnancy journey with personalized AI guidance, tracking tools, and expert insights."
          },
          ai: {
            title: "AI Pregnancy Assistant",
            subtitle: "Have questions about your pregnancy? Our AI assistant is here to help.",
            placeholder: "Ask me anything about your pregnancy...",
            button: "Ask",
            voice: "Voice Mode",
            loading: "Thinking...",
            error: "Sorry, I couldn't process that. Please try again."
          },
          safety: {
            title: "Medication & Food Safety Checker",
            subtitle: "Not sure if something is safe during pregnancy? Upload an image or enter the name.",
            placeholder: "Enter medication or food name...",
            button: "Check Safety",
            upload: "Upload Image",
            loading: "Analyzing...",
            safe: "Safe",
            unsafe: "Not Recommended",
            caution: "Use with Caution"
          },
          comingSoon: {
            title: "Coming Soon",
            nutrition: "Nutrition Planning",
            partner: "Partner Involvement",
            postpartum: "Postpartum Planning",
            babyShower: "Virtual Baby Shower",
            community: "Community Forums"
          },
          language: {
            select: "Language",
            en: "English",
            hi: "हिन्दी"
          },
          voice: {
            english: "English Voice",
            hindi: "Hindi Voice"
          },
          footer: {
            rights: "All Rights Reserved",
            terms: "Terms of Service",
            privacy: "Privacy Policy",
            disclaimer: "Medical Disclaimer",
            medical: "NauMah does not provide medical advice. Always consult with healthcare professionals for medical decisions."
          },
          mission: {
            title: "Our Mission",
            description: "At NauMah AI Technologies, we're dedicated to revolutionizing pregnancy care through innovative AI solutions.",
            point1: "Empower expectant mothers with personalized guidance",
            point2: "Make pregnancy journeys safer and more informed",
            point3: "Provide 24/7 AI-powered pregnancy support",
            quote: "Supporting every mother through the beautiful journey of pregnancy"
          },
          contact: {
            title: "Contact Us", 
            india: "India Headquarters:",
            indiaAddress: "NauMah AI Technologies Pvt. Ltd.<br />OneBKC, BKC<br />Mumbai - 400053, India",
            usa: "USA Office:",
            usaAddress: "Woodbridge Park<br />Virginia, USA 22192",
            email: "Email Us:",
            support: "support@naumah.com",
            business: "hypeme@naumah.com"
          },
          auth: {
            login: "Login",
            register: "Register",
            email: "Email",
            password: "Password",
            forgotPassword: "Forgot Password?",
            submit: "Submit",
            noAccount: "Don't have an account?",
            hasAccount: "Already have an account?",
            signUp: "Sign Up"
          }
        }
      },
      hi: {
        translation: {
          app: {
            title: "नौमा",
            slogan: "गर्भावस्था के हर चरण के लिए आपका बुद्धिमान साथी",
            companion: "आपका AI गर्भावस्था साथी"
          },
          navigation: {
            home: "होम",
            dashboard: "शिशु और मैं",
            tracker: "ट्रैकर",
            journal: "डायरी",
            diet: "आहार और व्यायाम",
            resources: "संसाधन",
            support: "सहायता",
            login: "लॉगिन",
            register: "रजिस्टर",
            logout: "लॉगआउट",
            profile: "प्रोफाइल"
          },
          hero: {
            subtitle: "व्यक्तिगत AI मार्गदर्शन, ट्रैकिंग टूल्स और विशेषज्ञ जानकारी के साथ अपनी गर्भावस्था यात्रा को आसान बनाएँ।"
          },
          ai: {
            title: "AI गर्भावस्था सहायक",
            subtitle: "क्या आपके गर्भावस्था के बारे में प्रश्न हैं? हमारा AI सहायक आपकी मदद करने के लिए तैयार है।",
            placeholder: "अपनी गर्भावस्था के बारे में कुछ भी पूछें...",
            button: "पूछें",
            voice: "वॉइस मोड",
            loading: "विचार कर रहा है...",
            error: "क्षमा करें, मैं इसे प्रोसेस नहीं कर सका। कृपया पुनः प्रयास करें।"
          },
          safety: {
            title: "दवा और खाद्य सुरक्षा चेकर",
            subtitle: "क्या आप सुनिश्चित नहीं हैं कि गर्भावस्था के दौरान कुछ सुरक्षित है? एक छवि अपलोड करें या नाम दर्ज करें।",
            placeholder: "दवा या खाद्य पदार्थ का नाम दर्ज करें...",
            button: "सुरक्षा जांचें",
            upload: "छवि अपलोड करें",
            loading: "विश्लेषण कर रहा है...",
            safe: "सुरक्षित",
            unsafe: "अनुशंसित नहीं",
            caution: "सावधानी के साथ उपयोग करें"
          },
          comingSoon: {
            title: "जल्द आ रहा है",
            nutrition: "पोषण योजना",
            partner: "साथी की भागीदारी",
            postpartum: "प्रसवोत्तर योजना",
            babyShower: "वर्चुअल बेबी शॉवर",
            community: "समुदाय फोरम"
          },
          language: {
            select: "भाषा",
            en: "English",
            hi: "हिन्दी"
          },
          voice: {
            english: "अंग्रेजी आवाज़",
            hindi: "हिंदी आवाज़"
          },
          footer: {
            rights: "सर्वाधिकार सुरक्षित",
            terms: "सेवा की शर्तें",
            privacy: "गोपनीयता नीति",
            disclaimer: "चिकित्सा अस्वीकरण",
            medical: "नौमा चिकित्सा सलाह प्रदान नहीं करता है। चिकित्सा निर्णयों के लिए हमेशा स्वास्थ्य देखभाल पेशेवरों से परामर्श करें।"
          },
          mission: {
            title: "हमारा मिशन",
            description: "नौमा AI टेक्नोलॉजीज में, हम नवीन AI समाधानों के माध्यम से गर्भावस्था देखभाल में क्रांति लाने के लिए समर्पित हैं।",
            point1: "गर्भवती माताओं को व्यक्तिगत मार्गदर्शन के साथ सशक्त बनाना",
            point2: "गर्भावस्था यात्रा को सुरक्षित और अधिक जानकारीपूर्ण बनाना",
            point3: "24/7 AI-संचालित गर्भावस्था सहायता प्रदान करना",
            quote: "हर माँ को गर्भावस्था की सुंदर यात्रा में सहयोग देना"
          },
          contact: {
            title: "संपर्क करें", 
            india: "भारत मुख्यालय:",
            indiaAddress: "नौमा AI टेक्नोलॉजीज प्राइवेट लिमिटेड<br />वनBKC, BKC<br />मुंबई - 400053, भारत",
            usa: "अमेरिका कार्यालय:",
            usaAddress: "वुडब्रिज पार्क<br />वर्जीनिया, अमेरिका 22192",
            email: "हमें ईमेल करें:",
            support: "support@naumah.com",
            business: "hypeme@naumah.com"
          },
          auth: {
            login: "लॉगिन",
            register: "रजिस्टर",
            email: "ईमेल",
            password: "पासवर्ड",
            forgotPassword: "पासवर्ड भूल गए?",
            submit: "सबमिट करें",
            noAccount: "खाता नहीं है?",
            hasAccount: "पहले से ही खाता है?",
            signUp: "साइन अप करें"
          }
        }
      }
    },

    // Default namespace
    defaultNS: 'translation',

    // React settings
    react: {
      useSuspense: true,
    }
  });

export default i18n;