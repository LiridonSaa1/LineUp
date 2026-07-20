# Plani i Migrimit: React Native & Advanced Design

Ky plan detajon procesin e kalimit nga React (Web/Capacitor) në **React Native (Expo)**, duke integruar një dizajm të avancuar dhe plotësisht nativ për një përvojë përdoruesi superiore.

## Pse React Native?
*   **Performance**: Shpejtësi 60fps me komponentë nativë.
*   **Native Look & Feel**: Ndërveprime që ndihen si pjesë organike e iOS/Android.
*   **Advanced Animations**: Përdorimi i `react-native-reanimated` për animacione komplekse që nuk mund të arrihen në WebView.

## Arkitektura e Re e Propozuar

### 1. Framework & Core
*   **Base**: [Expo](https://expo.dev/) (SDK 50+).
*   **Navigation**: [React Navigation](https://reactnavigation.org/) (Native Stack + Bottom Tabs).
*   **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS për React Native) – kjo na lejon të mbajmë stilin aktual por në komponentë nativë.
*   **Animations**: [Moti](https://moti.fyi/) (bazuar në Reanimated) për "advanced design" me lëvizje të lëmuara.

### 2. Design System (Advanced)
*   **Dark Mode by Default**: Një temë "Midnight Blue" me aksente të forta.
*   **Glassmorphism Nativ**: Përdorimi i `ExpoBlur` për efekte transparence reale lart dhe poshtë.
*   **Custom Interactions**:
    *   Haptic Feedback kur rezervoni ose shtypni butona.
    *   Shared Element Transitions ndërmjet listës së salloneve dhe faqes së detajeve.

## Fazat e Implementimit

### Faza 1: Inicializimi
*   Krijimi i strukturës së re të projektit Expo në folderin `rn-app/`.
*   Konfigurimi i `NativeWind` dhe temës së ngjyrave.
*   Instalimi i `@workspace/api-client` (duhet të kontrollojmë nëse funksionon në RN mjedis).

### Faza 2: Portimi i Komponentëve
*   **Navigimi**: Ndërtimi i `BottomTabNavigator` (Home, Search, Bookings, Profile).
*   **Shared Components**: Rindërtimi i butonave, inputeve dhe kartave duke përdorur `<View>`, `<Text>`, dhe `<TouchableOpacity>`.
*   **Icons**: Kalimi në `lucide-react-native`.

### Faza 3: Faqet Kryesore
*   **Home**: Hero section me animacione hyrëse dhe scrolling horizontal për "Offers".
*   **Booking Flow**: Një proces rezervimi "step-by-step" me modal-e native dhe kalendar interaktiv.

## Pyetje për Përdoruesin
> [!IMPORTANT]
> Migrimi në React Native kërkon një rindërtim pothuajse të plotë të pjesës vizuale (UI).
1.  A dëshironi që ta mbajmë logjikën e API-t të njëjtë apo të bëjmë ndryshime edhe aty?
2.  A jeni gati të fillojmë një strukturë të re projekti (Expo), pasi kjo do të zëvendësojë mënyrën si bëhet "build" aplikacioni?

## Verifikimi
*   Testimi në simulatorët e iOS dhe Android.
*   Kontrolli i performancës së animacioneve.
