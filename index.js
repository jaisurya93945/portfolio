// Play background music and typing effect on page load
document.addEventListener('DOMContentLoaded', function() {
    const bgm1Audio = document.getElementById('bgm1');
    const bgm2Audio = document.getElementById('bgm2');
    const bgm3Audio = document.getElementById('bgm3');

    // Function to start playing bgm2 and bgm3 in a loop
    function playBGM2andBGM3() {
        bgm2Audio.play();
        bgm3Audio.play();
    }

    // Function to play bgm1 once and then play bgm2 and bgm3
    function playBGM1() {
        bgm1Audio.play().then(() => {
            bgm1Audio.onended = playBGM2andBGM3;
        }).catch(error => {
            console.error('Error playing bgm1.mp3:', error);
        });
    }

    // Event listener for user interaction (click)
    document.addEventListener('click', function() {
        playBGM1();
        document.removeEventListener('click', arguments.callee); // Remove click listener after first click
    });

    // Typing effect for the name header
    const name = "B.JAISURYA";
    let index = 0;

    function type() {
        if (index < name.length) {
            document.getElementById('name-header').innerHTML += name.charAt(index);
            index++;
            setTimeout(type, 50); // Adjust typing speed here
        }
    }

    type(); // Start typing effect on page load
});

// JavaScript to track mouse movements and update cursor position
document.addEventListener('mousemove', function(e) {
    const cursor = document.getElementById('cursor');
    cursor.style.left = e.clientX + 'px'; // Update cursor horizontal position
    cursor.style.top = e.clientY + 'px'; // Update cursor vertical position
});




document.addEventListener('DOMContentLoaded', function() {
  const text = "So, you found my secret Cyber Vault, huh? Well, congratulations! You've just uncovered my meticulously crafted portfolio. As an Ethical Hacker, I've designed this site to showcase my skills and projects in cybersecurity. The sleek, hacker-themed interface and advanced UI effects are all part of the experience, reflecting my dedication to ethical hacking and cyber defense. Welcome to my world of code and cyber fortification!";
  const introParagraph = document.querySelector('.intro-paragraph');
  
  let i = 0;
  function typeWriter() {
    if (i < text.length) {
      introParagraph.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 55); // Adjust typing speed here
    }
  }
  
  typeWriter();
});
