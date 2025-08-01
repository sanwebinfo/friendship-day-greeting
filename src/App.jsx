import { useEffect, useState, useRef } from 'preact/hooks';
import DOMPurify from 'dompurify';
import slugify from 'slugify';
import Footer from './components/Footer';
import './index.css';

// Constants
const MAX_NAME_LENGTH = 30;
const MIN_NAME_LENGTH = 2;
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1080;
const TEXT_POSITION = { x: CANVAS_WIDTH / 2, y: 920 };
const FONT_STYLE = '700 32pt Anek Tamil';
const TEXT_COLOR = '#2c3e50';
const MAX_TEXT_WIDTH = CANVAS_WIDTH * 0.8;

// Utility functions
const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') return '';

  let cleanName = DOMPurify.sanitize(name).trim();
  cleanName = slugify(cleanName, {
    replacement: ' ',
    remove: /[*+~.()'"!:@]/g,
    lower: false,
    strict: false,
  });
  
  // Additional cleaning
  cleanName = cleanName
    .replace(/\++/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/%20+/g, ' ')
    .replace(/-+/g, ' ')
    .trim();

  if (cleanName.length < MIN_NAME_LENGTH || cleanName.length > MAX_NAME_LENGTH) {
    return '';
  }
  
  return cleanName;
};

const updateMetaTags = (cleanName, sanitizedURL) => {
  try {
    const metaTags = {
      title: `${cleanName} - Happy Friendship Day`,
      description: `${cleanName} a special friendship day greeting for you.`,
      url: sanitizedURL.toString()
    };

    document.title = metaTags.title;
    
    // Update meta tags safely
    const updateTag = (selector, attribute, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attribute, value);
    };

    updateTag('meta[name="description"]', 'content', metaTags.description);
    updateTag('link[rel="canonical"]', 'href', metaTags.url);
    updateTag('meta[property="og:title"]', 'content', metaTags.title);
    updateTag('meta[property="og:description"]', 'content', metaTags.description);
    updateTag('meta[property="og:url"]', 'content', metaTags.url);
    updateTag('meta[name="twitter:title"]', 'content', metaTags.title);
    updateTag('meta[name="twitter:description"]', 'content', metaTags.description);
    updateTag('meta[name="twitter:url"]', 'content', metaTags.url);
  } catch (error) {
    console.error("Error updating meta tags: ", error);
  }
};

// Friendship Card Generator Component
const FriendshipCardGenerator = ({ friendName }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const fontLoaded = useRef(false);
  const imageObjRef = useRef(new Image());

  const loadFont = async () => {
    if (fontLoaded.current) return true;
    
    try {
      const font = new FontFace(
        'Anek Tamil',
        'url(https://fonts.gstatic.com/s/anektamil/v4/XLYJIZH2bYJHGYtPGSbUB8JKTp-_9n55SsLHW0WZez6TjtkDu3uNnCB6qw.ttf)'
      );
      await font.load();
      document.fonts.add(font);
      fontLoaded.current = true;
      return true;
    } catch (err) {
      console.error('Failed to load font:', err);
      return false;
    }
  };

  const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lines.push({ text: line, width: context.measureText(line).width });
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    lines.push({ text: line, width: context.measureText(line).width });
    
    // Calculate vertical position based on number of lines
    const verticalOffset = -(lines.length - 1) * lineHeight / 2;
    
    // Draw each line
    lines.forEach((lineObj, i) => {
      context.fillText(lineObj.text.trim(), x, y + verticalOffset + (i * lineHeight));
    });
    
    return lines;
  };

  const generateImage = async (name) => {
    if (!name) return;
    
    setIsLoading(true);
    setError('');
    setImageUrl('');
    
    try {
      const fontSuccess = await loadFont();
      if (!fontSuccess) {
        throw new Error('Failed to load required font');
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas element not found');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Load and draw image
      const imageObj = imageObjRef.current;
      imageObj.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        imageObj.onload = () => {
          try {
            // Draw background
            ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
            
            // Configure text styling
            ctx.font = FONT_STYLE;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = TEXT_COLOR;
            
            // Text shadow for better readability
            ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
            ctx.shadowBlur = 4;
            
            // Wrap and draw text
            wrapText(ctx, name, TEXT_POSITION.x, TEXT_POSITION.y, MAX_TEXT_WIDTH, 50);
            
            ctx.shadowColor = 'transparent';
            
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        imageObj.onerror = () => reject(new Error('Failed to load background image'));
        imageObj.src = './friendship-image.png';
      });

      // Convert to data URL with higher quality
      const imageDataUrl = canvas.toDataURL('image/png', 1.0);
      setImageUrl(imageDataUrl);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (friendName) {
      generateImage(friendName);
    }
    
    return () => {
      // Cleanup
      if (imageObjRef.current) {
        imageObjRef.current.onload = null;
        imageObjRef.current.onerror = null;
      }
    };
  }, [friendName]);

  return (
    <div class="mt-6">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        class="hidden"
        aria-hidden="true"
      />
      
      {/* Loading State */}
      {isLoading && (
        <div class="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-xl">
          <div class="relative w-16 h-16 mb-4">
            <div class="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div class="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <p class="text-indigo-700 font-medium">Creating your personalized greeting...</p>
          <p class="text-sm text-indigo-500 mt-1">This may take a moment</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-700">Error generating image</h3>
              <div class="mt-2 text-sm text-red-600">
                <p>{error}</p>
              </div>
              <div class="mt-4">
                <button
                  onClick={() => generateImage(friendName)}
                  class="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview */}
      {imageUrl && (
        <div class="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div class="p-1 bg-gradient-to-r from-pink-500 to-purple-600">
            <div class="flex justify-center p-2 bg-white rounded-lg">
              <img 
                src={imageUrl} 
                alt={`Friendship day greeting for ${friendName}`}
                class="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
              />
            </div>
          </div>
          
          <div class="p-4">
            <a
              href={imageUrl}
              download={`friendship-day-${slugify(friendName, { lower: true })}.png`}
              class="group relative flex items-center justify-center w-full py-3 px-6 text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              <span class="relative z-10 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download Greeting Card
              </span>
              <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [friendName, setFriendName] = useState('');
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const chatBoxRef = useRef(null);
  const alertTimeoutRef = useRef(null);
  const timeIntervalRef = useRef(null);

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

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setIsAlertVisible(true);
    
    clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setIsAlertVisible(false);
    }, 5000);
  };

  useEffect(() => {
    const initializeFromURL = () => {
      try {
        const url = new URL(window.location.href);
        const search = new URLSearchParams(url.search);
        const name = search.get('name') || '';
        
        if (name) {
          const cleanName = sanitizeName(name);
          if (cleanName) {
            setFriendName(cleanName);
            const sanitizedURL = new URL(window.location.href);
            sanitizedURL.searchParams.set('name', slugify(cleanName, { 
              replacement: '-', 
              remove: /[*+~.()'"!:@]/g, 
              lower: false, 
              strict: false 
            }));
            window.history.replaceState(null, '', sanitizedURL.toString());
            updateMetaTags(cleanName, sanitizedURL);
          } else {
            setError(`Name must be between ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters`);
          }
        }
      } catch (err) {
        console.error("Error initializing from URL:", err);
        setError(err instanceof TypeError && err.message.includes("URI malformed") 
          ? 'The URL provided is malformed. Please check the URL and try again.'
          : 'An error occurred while processing the name.');
      }
    };

    initializeFromURL();

    // Initialize time
    setCurrentTime(formatTime());
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000);

    return () => {
      clearInterval(timeIntervalRef.current);
      clearTimeout(alertTimeoutRef.current);
    };
  }, [formatTime]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputName(value);
    
    // Real-time validation
    if (value.length > MAX_NAME_LENGTH) {
      setError(`Name must be less than ${MAX_NAME_LENGTH} characters`);
    } else {
      setError('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanName = sanitizeName(inputName);
    
    if (cleanName) {
      try {
        const sanitizedURL = new URL(window.location.href);
        sanitizedURL.searchParams.set('name', slugify(cleanName, { 
          replacement: '-', 
          remove: /[*+~.()'"!:@]/g, 
          lower: false, 
          strict: false 
        }));
        
        window.history.replaceState(null, '', sanitizedURL.toString());
        updateMetaTags(cleanName, sanitizedURL);
        setFriendName(cleanName);
        setInputName('');
        setError('');
        showAlert(`🎉 Greeting created for: ${cleanName}`);
        
        setTimeout(() => {
          chatBoxRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      } catch (err) {
        console.error("Error updating URL:", err);
        setError('Failed to update URL. Please try again.');
        showAlert('Failed to update URL. Please try again.', 'error');
      }
    } else {
      const errorMsg = `Please enter a valid name (${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} characters)`;
      setError(errorMsg);
      showAlert(errorMsg, 'error');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      const url = new URL(window.location.href);
      navigator.clipboard.writeText(url.toString())
        .then(() => showAlert('📋 Greeting URL copied to clipboard!'))
        .catch(() => showAlert('Failed to copy URL. Please try again.', 'error'));
    } catch (error) {
      showAlert('An error occurred while copying the URL.', 'error');
    }
  };

  // Alert type styling
  const alertStyles = {
    success: {
      bg: 'bg-green-600',
      icon: (
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-600',
      icon: (
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-600',
      icon: (
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  return (
    <div class="min-h-screen flex flex-col items-center py-8 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Material-style Snackbar Notification */}
      <div class={`fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out z-50 ${
  isAlertVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
}`}>
  <div class={`${alertStyles[alertType].bg} text-white px-6 py-3 rounded-lg shadow-xl flex items-center max-w-[90vw] sm:max-w-md`}>
    {alertStyles[alertType].icon}
    <span class="flex-grow text-sm sm:text-base break-words whitespace-normal">
      {alertMessage}
    </span>
    <button 
      class="ml-4 text-gray-100 hover:text-white focus:outline-none transition-colors"
      onClick={() => setIsAlertVisible(false)}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </button>
  </div>
      </div>

      <main class="w-full max-w-md space-y-6">
        {/* Chat Box */}
        <div 
          ref={chatBoxRef}
          class="relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
        >
          <button
            onClick={handleCopyToClipboard}
            class="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white hover:shadow-lg active:scale-95 focus:outline-none transition-all duration-200 group"
            aria-label="Copy greeting URL"
            title="Copy shareable link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>

          <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
            <h1 class="text-white text-sm font-bold text-center tracking-tight flex items-center justify-center">
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Happy Friendship Day 🎉
            </h1>
          </div>
          
          <div class="p-5 space-y-4">
            {error ? (
              <div class="bg-red-50 text-red-700 p-4 rounded-lg border-l-4 border-red-500">
                <p class="font-medium">{error}</p>
              </div>
            ) : (
              <>
                <div class="flex justify-end">
                  <div class="relative bg-purple-100 text-purple-900 rounded-2xl rounded-tr-none px-5 py-3 max-w-[85%] shadow-sm transform transition-all duration-200 hover:scale-[1.02] will-change-transform group">
                    <div class="absolute -left-2 top-0 w-3 h-3 overflow-hidden">
                      <div class="w-full h-full bg-purple-100 transform rotate-45 origin-bottom-right"></div>
                    </div>
                    <p class="break-words">
                      {friendName ? `😊 ${friendName} 👋` : '👋 Your Friend Name Here'}
                    </p>
                    <div class="text-xs text-purple-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
                
                <div class="flex justify-start">
                  <div class="relative bg-indigo-100 text-indigo-900 rounded-2xl rounded-tl-none px-5 py-3 max-w-[85%] shadow-sm transform transition-all duration-200 hover:scale-[1.02] will-change-transform group">
                    <div class="absolute -right-2 top-0 w-3 h-3 overflow-hidden">
                      <div class="w-full h-full bg-indigo-100 transform -rotate-45 origin-bottom-left"></div>
                    </div>
                    <p class="break-words">Happy Friendship Day 🎉</p>
                    <div class="text-xs text-indigo-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
                
                <div class="flex justify-end">
                  <div class="relative bg-purple-100 text-purple-900 rounded-2xl rounded-tr-none px-5 py-3 max-w-[85%] shadow-sm transform transition-all duration-200 hover:scale-[1.02] will-change-transform group">
                    <div class="absolute -left-2 top-0 w-3 h-3 overflow-hidden">
                      <div class="w-full h-full bg-purple-100 transform rotate-45 origin-bottom-right"></div>
                    </div>
                    <p class="break-words">Friendship is a symbol of unity, always preserve it 💜</p>
                    <div class="text-xs text-purple-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>
                
                <div class="flex justify-start">
                  <div class="relative bg-indigo-100 text-indigo-900 rounded-2xl rounded-tl-none px-5 py-3 max-w-[85%] shadow-sm transform transition-all duration-200 hover:scale-[1.02] will-change-transform group">
                    <div class="absolute -right-2 top-0 w-3 h-3 overflow-hidden">
                      <div class="w-full h-full bg-indigo-100 transform -rotate-45 origin-bottom-left"></div>
                    </div>
                    <p class="break-words">In the garden of life, friends are the flowers that make it bloom with joy 🌸</p>
                    <div class="text-xs text-indigo-500 mt-1 text-right">{currentTime}</div>
                  </div>
                </div>

                {/* Friendship Card Generator */}
                {friendName && (
                  <div class="flex justify-center">
                    <div class="w-full">
                      <FriendshipCardGenerator friendName={friendName} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Action Form */}
        <div class="flex flex-col space-y-4">
          <form onSubmit={handleFormSubmit} class="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div class="p-5 space-y-4">
              <h2 class="text-xl font-bold text-center text-gray-800 tracking-tight flex items-center justify-center">
                <svg class="w-6 h-6 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                Create Your Greeting 🎀
              </h2>
              
              <div>
                <label class="block text-gray-700 text-sm font-medium mb-2 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Friend's Name
                </label>
                <div class="relative">
                  <input
                    type="text"
                    value={inputName}
                    onInput={handleInputChange}
                    maxLength={MAX_NAME_LENGTH}
                    class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 peer"
                    placeholder="Enter friend's name"
                  />
                  <div class="absolute left-3 top-3 text-gray-400 peer-focus:text-purple-500 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  {inputName && (
                    <div class="absolute right-3 top-3 text-gray-400">
                      {inputName.length}/{MAX_NAME_LENGTH}
                    </div>
                  )}
                </div>
                {error && (
                  <p class="mt-2 text-sm text-red-600 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {error}
                  </p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={!inputName.trim()}
                class={`w-full py-3 px-6 rounded-xl text-white font-bold shadow-md focus:outline-none transition-all duration-200 active:scale-95 will-change-transform flex items-center justify-center ${
                  !inputName.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                }`}
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Create Greeting
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