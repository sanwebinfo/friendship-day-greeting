const Footer = () => {
  return (
    <footer class="mt-8 w-full max-w-md">
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-center">
          <p class="text-white text-sm font-medium">
            Made with ❤️ using <strong>Preact</strong> | 
            <a 
              href="https://github.com/sanwebinfo/friendship-day-greeting" 
              target="_blank" 
              rel="nofollow noopener" 
              class="text-amber-200 hover:text-white hover:underline ml-1 transition-colors duration-200"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
