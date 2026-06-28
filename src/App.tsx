import { useState, useEffect } from "react";
import alexanderLogo from "../public/alexander_logo.png";
import { Sun, Moon } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import DevotionalView from "./components/DevotionalView";

/* ======================
   Data
====================== */
const CORRECT_PIN = "1234";
const PROJECT_LINK =
  "https://wa.me/2349160979848?text=Hi%20Alexander%2C%20I%27d%20like%20to%20see%20your%20projects.";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

/* ======================
   Component
====================== */
function App() {
  const [pin, setPin] = useState("");
  const [showPasswordUI, setShowPasswordUI] = useState(false);
  const [isError, setIsError] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showDevotional, setShowDevotional] = useState(false);

  /* ======================
     Effects
  ====================== */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        setTimeout(() => {
          window.location.href = PROJECT_LINK;
        }, 300);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsError(true);
        setTimeout(() => {
          setPin("");
          setIsError(false);
        }, 1200);
      }
    }
  }, [pin]);

  /* ======================
     Logic
  ====================== */
  const handleKeyPress = (key: string) => {
    if (pin.length === 4) return;
    setPin((prev) => prev + key);
  };

  const clearKey = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-white dark:bg-black transition-colors duration-700">
      {/* Neon Animated Background */}
      <div className="container absolute md:scale-[1.4]"></div>

      {/* Theme Toggle */}

      <button
        onClick={toggleTheme}
        aria-label="Toggle Theme"
        className="absolute top-6 right-6 
  p-3 rounded-full z-[999] hidden
  border border-black/30 dark:border-white/30
  text-black dark:text-white
  hover:scale-110 active:scale-95
  transition-all duration-300"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 transition-transform duration-500" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-500" />
        )}
      </button>

      {/* ======================
          Home Screen
      ====================== */}
      <div className="w-full z-50 relative min-h-screen flex flex-col items-center justify-center gap-6 text-black dark:text-white transition-colors duration-700">
        <img src={alexanderLogo} className="w-56 md:w-64" alt="" />

        <h1 className="text-3xl md:text-6xl xl:text-8xl font-bold text-center">
          Alexander D Bridge
        </h1>
        <p className="-mt-4 opacity-70">Frontend Developer</p>

        <div className="flex gap-4 relative z-[5]">
          <a
            href="https://wa.me/2349160979848?text=Hi%20Alexander%2C%20I’d%20like%20to%20hire%20you."
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-6 rounded-full bg-black text-white dark:bg-white dark:text-black transition active:scale-[0.97]"
          >
            Hire Me
          </a>

          <button
            onClick={() => setShowPasswordUI(true)}
            className="py-3 px-6 rounded-full border-2 border-black dark:border-white transition active:scale-[0.97]"
          >
            View My Projects
          </button>

          <button
            onClick={() => setShowDevotional(true)}
            className="py-3 px-6 rounded-full border-2 border-black dark:border-white transition active:scale-[0.97]"
          >
            View Devotional
          </button>
        </div>
      </div>

      {/* ======================
          Password Modal
      ====================== */}
      {showPasswordUI && (
        <div className="absolute inset-0 dark:text-white bg-white dark:bg-black flex flex-col items-center justify-center gap-10 z-50 transition-colors duration-700">
          <p className="uppercase text-sm tracking-widest opacity-70 ">
            Enter Passcode
          </p>

          {/* PIN Dots */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border transition
                ${pin.length > i ? "bg-black dark:bg-white border-black" : "border-gray-400"}
                ${isError ? "animate-shake" : ""}`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="flex flex-wrap w-[280px] justify-center gap-4 relative">
            {KEYS.map((key, i) => (
              <button
                key={i}
                onClick={() => handleKeyPress(key)}
                style={{
                  animationDelay: isError ? `${i * 0.05}s` : `${i * 0.01}s`,
                }}
                className={`w-[5rem] h-[5rem] rounded-full ${isError ? "animate-shake" : ""} text-2xl font-medium bg-black/5 active:rounded-xl active:scale-95 dark:text-white dark:bg-white/10 transition duration-200 active:bg-black/80 active:text-white`}
              >
                {key}
              </button>
            ))}

            {pin.length > 0 && (
              <button
                onClick={clearKey}
                aria-label="clear button"
                className={`animate-fade absolute left-4 bottom-2 p-4 rounded-full duration-100 `}
              >
                {" "}
                <svg
                  className="size-8"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    {" "}
                    <path
                      d="m 7 2 c -0.832031 0 -1.558594 0.34375 -2.292969 0.78125 s -1.464843 1.003906 -2.128906 1.597656 c -0.660156 0.597656 -1.253906 1.222656 -1.707031 1.796875 c -0.226563 0.289063 -0.417969 0.5625 -0.570313 0.835938 c -0.152343 0.277343 -0.300781 0.53125 -0.300781 0.988281 s 0.148438 0.710938 0.300781 0.984375 c 0.152344 0.277344 0.34375 0.550781 0.570313 0.835937 c 0.453125 0.578126 1.046875 1.203126 1.707031 1.796876 c 0.664063 0.597656 1.394531 1.164062 2.128906 1.601562 s 1.460938 0.78125 2.292969 0.78125 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 1 3 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0"
                      fill="currentColor"
                    ></path>{" "}
                  </g>
                </svg>{" "}
              </button>
            )}
          </div>

          <button
            onClick={() => setShowPasswordUI(false)}
            className="text-sm opacity-50 hover:opacity-100 transition dark:text-white"
          >
            Cancel
          </button>

          <a
            style={{ animationDelay: isError ? `0.05s` : "0s" }}
            href="https://wa.me/2349160979848?text=I'm%20trying%20to%20access%20your%20projects%20but%20I%20don't%20know%20the%20passcode"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="keypad"
            className={`p-3 px-6 dark:bg-white/20 rounded-full active:rounded-xl text-xl font-medium text-white bg-black active:scale-95 transition duration-200`}
          >
            {" "}
            Emergency{" "}
          </a>
        </div>
      )}

      {/* Mount Isolated Cinematic Experience Overlay */}
      <AnimatePresence>
        {showDevotional && (
          <DevotionalView onClose={() => setShowDevotional(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
