document.addEventListener("DOMContentLoaded", () => {
  // --- Page Enter Animation ---
  document.body.classList.add("page-enter");

  // --- Light/Dark Mode Toggle ---
  const modeBtn = document.getElementById("modeToggle");
  if (modeBtn) {
    // Load saved mode on page load
    if (localStorage.getItem("darkMode") === "true") {
      document.body.classList.add("dark-mode");
    }

    modeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      // Save preference to localStorage
      localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark-mode")
      );
    });
  }

  // --- Smooth Page Transition for Links ---
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      // Ignore links that don't go to another page
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      e.preventDefault();
      // Trigger exit animation
      document.body.classList.add("page-exit");
      document.body.classList.remove("page-enter");

      setTimeout(() => {
        window.location.href = href;
      }, 400); // Should be slightly less than CSS transition duration
    });
  });

  // --- Page-Specific Logic ---
  const videoGrid = document.getElementById("videoGrid");
  const videoPlayer = document.getElementById("videoPlayer");
  const uploadForm = document.getElementById("uploadForm");

  // --- HOME PAGE LOGIC ---
  if (videoGrid) {
    // Load saved videos from localStorage
    const videos = JSON.parse(localStorage.getItem("videos")) || [];

    // Clear the grid first to avoid duplicating sample videos
    videoGrid.innerHTML = '';

    // If no videos are saved, you can add default/sample videos here
    if (videos.length === 0) {
       // Example: You can show a "No videos found" message
       videoGrid.innerHTML = '<p>No videos uploaded yet. Click Upload to add one!</p>';
    }

    // Show each video in the grid
    videos.forEach((video) => {
      const div = document.createElement("div");
      div.className = "video-card";
// Find this line again in the HOME PAGE LOGIC
div.innerHTML = `
  <div class="thumb">
    <img src="${video.thumbnail}" alt="${video.title}">
  </div>
  <h3>${video.title}</h3>
  <p><a href="channel.html?name=${encodeURIComponent(video.channelName)}">${video.channelName || 'Creator'}</a><br>${video.views} views</p>
`;
      // When a video card is clicked, save its data and go to the watch page
      div.addEventListener("click", () => {
        localStorage.setItem("selectedVideo", JSON.stringify(video));
        // Use the link navigation logic for a smooth transition
        const watchLink = document.createElement('a');
        watchLink.href = 'watch.html';
        watchLink.click();
      });
      videoGrid.appendChild(div);
    });

    // --- SEARCH FILTER LOGIC ---
    // This was broken due to a misplaced curly brace. It's fixed now.
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll(".video-card");
        cards.forEach((card) => {
          const title = card.querySelector("h3").textContent.toLowerCase();
          // Hide or show the card based on whether the title includes the search query
          card.style.display = title.includes(query) ? "flex" : "none";
        });
      });
    }
  } // End of if(videoGrid) block

// --- WATCH PAGE LOGIC ---
  if (videoPlayer) {
    const selectedVideoStr = localStorage.getItem("selectedVideo");

    if (selectedVideoStr) {
      let video = JSON.parse(selectedVideoStr);

      // 1. Load Video Details
      document.getElementById("videoTitle").innerText = video.title;
      document.getElementById("videoDescription").innerText = "Uploaded video: " + video.title;
      videoPlayer.src = video.file;
      videoPlayer.poster = video.thumbnail;
      
      // 2. View Counter Logic
      let allVideos = JSON.parse(localStorage.getItem("videos")) || [];
      const videoIndex = allVideos.findIndex(v => v.file === video.file && v.title === video.title);
      
      if (videoIndex !== -1) {
        if (!sessionStorage.getItem('viewed_' + video.file)) {
            allVideos[videoIndex].views = (Number(allVideos[videoIndex].views) || 0) + 1;
            sessionStorage.setItem('viewed_' + video.file, 'true');
        }
        localStorage.setItem("videos", JSON.stringify(allVideos));
        localStorage.setItem("selectedVideo", JSON.stringify(allVideos[videoIndex]));
        video = allVideos[videoIndex];
      }
      
      // 3. Like/Dislike Logic
      const likeBtn = document.getElementById("likeBtn");
      const dislikeBtn = document.getElementById("dislikeBtn");
      likeBtn.querySelector("span").innerText = video.likes || 0;
      dislikeBtn.querySelector("span").innerText = video.dislikes || 0;
      
      likeBtn.addEventListener("click", () => {
        let currentVideos = JSON.parse(localStorage.getItem("videos"));
        let currentVideoIndex = currentVideos.findIndex(v => v.file === video.file);
        currentVideos[currentVideoIndex].likes = (currentVideos[currentVideoIndex].likes || 0) + 1;
        likeBtn.querySelector("span").innerText = currentVideos[currentVideoIndex].likes;
        localStorage.setItem("videos", JSON.stringify(currentVideos));
      });

      dislikeBtn.addEventListener("click", () => {
        let currentVideos = JSON.parse(localStorage.getItem("videos"));
        let currentVideoIndex = currentVideos.findIndex(v => v.file === video.file);
        currentVideos[currentVideoIndex].dislikes = (currentVideos[currentVideoIndex].dislikes || 0) + 1;
        dislikeBtn.querySelector("span").innerText = currentVideos[currentVideoIndex].dislikes;
        localStorage.setItem("videos", JSON.stringify(currentVideos));
      });

      // --- NEW: "Up Next" Sidebar Logic ---
      const upNextList = document.getElementById("upNextList");
      
      // Filter out the video that is currently playing
      const otherVideos = allVideos.filter(v => v.file !== video.file);
      upNextList.innerHTML = ""; // Clear the list before adding new items

      // Loop through the other videos and create an element for each
      otherVideos.forEach(nextVideo => {
        const item = document.createElement("div");
        item.className = "up-next-item";
        item.innerHTML = `
          <img src="${nextVideo.thumbnail}" alt="${nextVideo.title}">
          <div class="info">
            <h4>${nextVideo.title}</h4>
            <p>${nextVideo.views} views</p>
          </div>
        `;

        // Add a click listener to play the next video
        item.addEventListener("click", () => {
          localStorage.setItem("selectedVideo", JSON.stringify(nextVideo));
          // Reload the page to load the new video's content
          window.location.reload(); 
        });

        upNextList.appendChild(item);
      });
      // --- End of Sidebar Logic ---

      // 5. Comments Logic
      if (!video.comments) {
        video.comments = [];
      }
      const commentsList = document.getElementById("commentsList");
      const commentForm = document.getElementById("commentForm");
      function renderComments() {
        commentsList.innerHTML = "";
        video.comments.slice().reverse().forEach(comment => {
          const div = document.createElement("div");
          div.className = "comment";
          div.innerHTML = `<div class="comment-author">User</div><div class="comment-text">${comment}</div>`;
          commentsList.appendChild(div);
        });
      }
      renderComments();
      if (commentForm) {
        commentForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const input = document.getElementById("commentInput");
          const newComment = input.value.trim();
          if (newComment) {
            video.comments.push(newComment);
            let currentVideos = JSON.parse(localStorage.getItem("videos"));
            let currentVideoIndex = currentVideos.findIndex(v => v.file === video.file);
            if (currentVideoIndex !== -1) {
                currentVideos[currentVideoIndex].comments = video.comments;
                localStorage.setItem("videos", JSON.stringify(currentVideos));
            }
            localStorage.setItem("selectedVideo", JSON.stringify(video));
            renderComments();
            input.value = "";
          }
        });
      }
    }
  }
  // --- UPLOAD PAGE LOGIC ---
  if (uploadForm) {
    uploadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("videoTitle").value;
      const fileInput = document.getElementById("videoFile");
      const file = fileInput.files[0];
// --- CHANNEL PAGE LOGIC ---
  const channelVideoGrid = document.getElementById("channelVideoGrid");
  if (channelVideoGrid) {
    // Get the channel name from the URL query parameter
    const params = new URLSearchParams(window.location.search);
    const channelName = params.get('name');
    
    document.getElementById("channelTitle").innerText = channelName || "Channel Not Found";

    const videos = JSON.parse(localStorage.getItem("videos")) || [];
    // Filter the videos to get only those from the current channel
    const channelVideos = videos.filter(video => video.channelName === channelName);

    if (channelVideos.length > 0) {
      channelVideos.forEach(video => {
        const div = document.createElement("div");
        div.className = "video-card";
        div.innerHTML = `
          <div class="thumb"><img src="${video.thumbnail}" alt="${video.title}"></div>
          <h3>${video.title}</h3>
          <p>${video.channelName}<br>${video.views} views</p>`;
        div.addEventListener("click", () => {
          localStorage.setItem("selectedVideo", JSON.stringify(video));
          window.location.href = 'watch.html';
        });
        channelVideoGrid.appendChild(div);
      });
    } else {
      channelVideoGrid.innerHTML = "<p>No videos found for this channel.</p>";
    }
  }
      if (file) {
        const reader = new FileReader();
        reader.onload = function () {
          const videos = JSON.parse(localStorage.getItem("videos")) || [];
// Inside the uploadForm event listener
const title = document.getElementById("videoTitle").value;
const channelName = document.getElementById("channelName").value; // Get the new value
const fileInput = document.getElementById("videoFile");
// ...

const newVideo = {
  title: title,
  channelName: channelName, // Add this property
  thumbnail: "https://picsum.photos/400/225?random=" + Math.floor(Math.random() * 1000),
  views: 0,
  likes: 0,
  dislikes: 0,
  file: reader.result,
};
          videos.push(newVideo);
          localStorage.setItem("videos", JSON.stringify(videos));
          // Redirect to home page after upload
          window.location.href = "index.html";
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
