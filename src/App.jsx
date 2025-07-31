import { useEffect, useState, useRef } from 'preact/hooks';
// @ts-ignore
import DOMPurify from 'dompurify';
import slugify from 'slugify';
import Footer from './components/Footer';
import './index.css';

const sanitizeName = (name) => {
  let cleanName = DOMPurify.sanitize(name).trim();
  cleanName = slugify(cleanName, {
    replacement: ' ',
    remove: /[*+~.()'"!:@]/g,
    lower: false,
    strict: false,
  });
  cleanName = cleanName.replace(/\++/g, ' '); 
  cleanName = cleanName.replace(/\s+/g, ' ');
  cleanName = cleanName.replace(/%20+/g, ' ');
  cleanName = cleanName.replace(/-+/g, ' ');
  if (cleanName.length < 2 || cleanName.length > 36) {
    return '';
  }
  return cleanName;
};

const updateMetaTags = (cleanName, sanitizedURL) => {
  try {
    document.title = `${cleanName} - Happy Friendship Day`;
    document.querySelector('meta[name="description"]').setAttribute('content', `${cleanName} a special friendship day greeting for you.`);
    document.querySelector('link[rel="canonical"]').setAttribute('href', sanitizedURL.toString());
    document.querySelector('meta[property="og:title"]').setAttribute('content', `${cleanName} - Happy Friendship Day`);
    document.querySelector('meta[property="og:description"]').setAttribute('content', `${cleanName} a special friendship day greeting for you.`);
    document.querySelector('meta[property="og:url"]').setAttribute('content', sanitizedURL.toString());
    document.querySelector('meta[name="twitter:title"]').setAttribute('content', `${cleanName} - Happy Friendship Day`);
    document.querySelector('meta[name="twitter:description"]').setAttribute('content', `${cleanName} a special friendship day greeting for you.`);
    document.querySelector('meta[name="twitter:url"]').setAttribute('content', sanitizedURL.toString());
  } catch (error) {
    console.error("Error updating meta tags: ", error);
  }
};

const App = () => {
  const [friendName, setFriendName] = useState('');
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const chatBoxRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const timeIntervalRef = useRef(null);

  // Memoized time formatter to prevent unnecessary recreations
  const formatTime = useRef(() => {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' };
    const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' };
    // @ts-ignore
    const timeString = now.toLocaleTimeString('en-IN', timeOptions);
    // @ts-ignore
    const dateString = now.toLocaleDateString('en-IN', dateOptions);
    return `${dateString} ${timeString}`;
  }).current;

  const showAlert = (message) => {
    setAlertMessage(message);
    setIsAlertVisible(true);
    
    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
    
    // Set new timeout
    alertTimeoutRef.current = setTimeout(() => {
      setIsAlertVisible(false);
    }, 3000);
  };

  useEffect(() => {
    try {
      // @ts-ignore
      const url = new URL(window.location);
      const search = new URLSearchParams(url.search);
      const name = search.get('name') || '';
      const user = slugify(name, {
        replacement: '-',
        remove: /[$%*_+~.()'"!\-:@]+/g,
        lower: false,
        strict: false,
      });
      if (user) {
        const cleanName = sanitizeName(name);
        if (cleanName) {
          setFriendName(cleanName);
          // @ts-ignore
          const sanitizedURL = new URL(window.location);
          sanitizedURL.searchParams.set('name', slugify(cleanName, { replacement: '-', remove: /[*+~.()'"!:@]/g, lower: false, strict: false }));
          window.history.replaceState(null, '', sanitizedURL.toString());
          updateMetaTags(cleanName, sanitizedURL);
        } else {
          setError('Invalid name provided. Please ensure it is between 2 to 36 characters.');
        }
      } else {
        setError('No name provided in the URL.');
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("URI malformed")) {
        setError('The URL provided is malformed. Please check the URL and try again.');
      } else {
        setError('Internal server error: An error occurred while processing the name.');
      }
      console.error("Error occurred: ", err);
    }

    // Initialize time and set interval
    setCurrentTime(formatTime());
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000);

    // Cleanup
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [formatTime]);

  const handleInputChange = (e) => {
    setInputName(e.target.value);
    setError('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanName = sanitizeName(inputName);
    if (cleanName) {
      // @ts-ignore
      const sanitizedURL = new URL(window.location);
      sanitizedURL.searchParams.set('name', slugify(cleanName, { replacement: '-', remove: /[*+~.()'"!:@]/g, lower: false, strict: false }));
      window.history.replaceState(null, '', sanitizedURL.toString());
      updateMetaTags(cleanName, sanitizedURL);
      setFriendName(cleanName);
      setInputName('');
      setError('');
      showAlert(`Greeting created for: ${cleanName}`);

      // Scroll to chat after slight delay
      setTimeout(() => {
        chatBoxRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }, 100);
    } else {
      setError('Invalid name provided. Please ensure it is between 2 to 36 characters.');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      // @ts-ignore
      const sanitizedURL = new URL(window.location);
      navigator.clipboard.writeText(sanitizedURL.toString())
        .then(() => {
          showAlert('Greeting URL copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
          showAlert('Failed to copy the URL. Please try again.');
        });
    } catch (error) {
      showAlert('An error occurred while copying the URL.');
    }
  };

  return (
    <div class="min-h-screen flex flex-col items-center py-8 px-4 bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Snackbar Notification */}
      <div class={`fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out z-50 ${
        isAlertVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div class="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center max-w-xs sm:max-w-sm">
          <span class="flex-grow">{alertMessage}</span>
          <button 
            class="ml-4 text-gray-300 hover:text-white focus:outline-none"
            onClick={() => setIsAlertVisible(false)}
          >
            ✕
          </button>
        </div>
      </div>

      <main class="w-full max-w-md space-y-6">
        {/* Chat Box */}
        <div 
          ref={chatBoxRef}
          class="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl"
        >
          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-5">
            <h1 class="text-white text-xl font-bold text-center tracking-tight">Happy Friendship Day 🎉</h1>
          </div>
          
          <div class="p-5 space-y-4">
            {error ? (
              <div class="bg-red-50 text-red-700 p-4 rounded-lg border-l-4 border-red-500">
                <p class="font-medium">{error}</p>
              </div>
            ) : (
              <>
                <div class="flex justify-end">
                  <div class="bg-purple-100 text-purple-900 rounded-2xl rounded-tr-none px-5 py-3 max-w-[85%] shadow-sm transform transition-transform duration-200 hover:scale-[1.02] will-change-transform">
                    {friendName ? `😊 ${friendName} 👋` : '👋 Your Friend Name Here'}
                    <div class="text-xs text-purple-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
                
                <div class="flex justify-start">
                  <div class="bg-indigo-100 text-indigo-900 rounded-2xl rounded-tl-none px-5 py-3 max-w-[85%] shadow-sm transform transition-transform duration-200 hover:scale-[1.02] will-change-transform">
                    <p>Happy Friendship Day 🎉</p>
                    <div class="text-xs text-indigo-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
                
                <div class="flex justify-end">
                  <div class="bg-purple-100 text-purple-900 rounded-2xl rounded-tr-none px-5 py-3 max-w-[85%] shadow-sm transform transition-transform duration-200 hover:scale-[1.02] will-change-transform">
                    <p>Friendship is a symbol of unity, always preserve it 💜</p>
                    <div class="text-xs text-purple-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
                
                <div class="flex justify-start">
                  <div class="bg-indigo-100 text-indigo-900 rounded-2xl rounded-tl-none px-5 py-3 max-w-[85%] shadow-sm transform transition-transform duration-200 hover:scale-[1.02] will-change-transform">
                    <p>In the garden of life, friends are the flowers that make it bloom with joy 🌸</p>
                    <div class="text-xs text-indigo-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div class="flex flex-col space-y-4">
          <button 
            onClick={handleCopyToClipboard} 
            class="w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md focus:outline-none transition-all duration-200 active:scale-95 will-change-transform"
          >
            <span class="font-medium">Copy Greeting URL</span>
          </button>

          <form onSubmit={handleFormSubmit} class="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div class="p-5 space-y-4">
              <h2 class="text-xl font-bold text-center text-gray-800 tracking-tight">Create Your Greeting</h2>
              
              <div>
                <label class="block text-gray-700 text-sm font-medium mb-2">Friend's Name</label>
                <input
                  type="text"
                  value={inputName}
                  onInput={handleInputChange}
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter friend's name"
                />
                {error && <p class="mt-2 text-sm text-red-600">{error}</p>}
              </div>
              
              <button 
                type="submit" 
                class="w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md focus:outline-none transition-all duration-200 active:scale-95 will-change-transform"
              >
                <span class="font-medium">Create Greeting</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;