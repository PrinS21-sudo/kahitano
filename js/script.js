const quizBank = [
    { question: 'Which planet is known as the Red Planet?', options: ['Mars', 'Venus', 'Jupiter', 'Mercury'], answer: 'Mars' },
    { question: 'What is the largest ocean on Earth?', options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean'], answer: 'Pacific Ocean' },
    { question: 'Which animal is the tallest in the world?', options: ['Elephant', 'Giraffe', 'Camel', 'Horse'], answer: 'Giraffe' },
    { question: 'What is the capital city of France?', options: ['Berlin', 'Rome', 'Paris', 'Madrid'], answer: 'Paris' },
    { question: 'Which fruit is known for having a lot of potassium?', options: ['Apple', 'Banana', 'Orange', 'Grapes'], answer: 'Banana' },
    { question: 'Which month has 28 days in a common year?', options: ['February', 'April', 'June', 'November'], answer: 'February' },
    { question: 'Who wrote the play Romeo and Juliet?', options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], answer: 'William Shakespeare' },
    { question: 'Which is the largest mammal on Earth?', options: ['African Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'], answer: 'Blue Whale' },
    { question: 'Which language has the most native speakers in the world?', options: ['English', 'Spanish', 'Mandarin Chinese', 'Hindi'], answer: 'Mandarin Chinese' },
    { question: 'What color do you get when you mix blue and yellow?', options: ['Purple', 'Green', 'Orange', 'Red'], answer: 'Green' },
    { question: 'Which country is famous for the pyramids of Giza?', options: ['Mexico', 'Egypt', 'Greece', 'Turkey'], answer: 'Egypt' },
    { question: 'What is the tallest mountain in the world?', options: ['K2', 'Mount Kilimanjaro', 'Mount Everest', 'Mont Blanc'], answer: 'Mount Everest' },
    { question: 'Which bird is known for being able to mimic human speech?', options: ['Eagle', 'Parrot', 'Owl', 'Penguin'], answer: 'Parrot' },
    { question: 'What is the freezing point of water in Celsius?', options: ['0', '10', '100', '-10'], answer: '0' },
    { question: 'Which season comes after spring?', options: ['Winter', 'Summer', 'Autumn', 'Rainy Season'], answer: 'Summer' },
    { question: 'What is the national flower of Japan?', options: ['Rose', 'Cherry Blossom', 'Sunflower', 'Lotus'], answer: 'Cherry Blossom' },
    { question: 'Which instrument has 88 keys?', options: ['Violin', 'Piano', 'Trumpet', 'Guitar'], answer: 'Piano' },
    { question: 'Which dessert is made with milk, sugar, and eggs and often chilled?', options: ['Cake', 'Pudding', 'Bread', 'Pie'], answer: 'Pudding' },
    { question: 'Which sea creature has eight arms?', options: ['Shark', 'Octopus', 'Dolphin', 'Turtle'], answer: 'Octopus' },
    { question: 'What is the currency of Japan?', options: ['Won', 'Peso', 'Yen', 'Baht'], answer: 'Yen' }
];

let timerInterval;
let score;
let currentQuestions = [];

function shuffleArray(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function buildQuestionRows() {
    const container = document.getElementById('questionContainer');
    container.innerHTML = '';

    currentQuestions.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.question}</td>
            <td>
                <input type="text" id="q${index + 1}" placeholder="Type your answer" autocomplete="off">
            </td>
        `;
        container.appendChild(row);
    });
}

function startQuiz() {
    const studentName = document.getElementById('studentName').value.trim();
    const courseSection = document.getElementById('courseSection').value.trim();
    const quizDateInput = document.getElementById('quizDate').value;

    if (!studentName || !courseSection || !quizDateInput) {
        alert('Please fill in all fields.');
        return;
    }

    const year = quizDateInput.split('-')[0];
    if (!/^\d{4}$/.test(year)) {
        alert('Please enter a valid 4-digit year.');
        return;
    }

    currentQuestions = shuffleArray(quizBank).slice(0, 10);
    buildQuestionRows();

    document.getElementById('start').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    startTimer();

    const [y, m, d] = quizDateInput.split('-');
    localStorage.setItem('quizStudentName', studentName);
    localStorage.setItem('quizCourseSection', courseSection);
    localStorage.setItem('quizDate', `${m}/${d}/${y}`);
}

function startTimer() {
    let timeLeft = 180;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswers();
        }

        timeLeft--;
    }, 1000);
}

function checkAnswers() {
    clearInterval(timerInterval);

    const answers = [];
    score = 0;
    let answeredCount = 0;

    for (let i = 0; i < currentQuestions.length; i++) {
        const userAnswer = document.getElementById(`q${i + 1}`).value.trim().toLowerCase();
        const correctAnswer = currentQuestions[i].answer.trim().toLowerCase();

        const isCorrect = userAnswer === correctAnswer;
        if (userAnswer) answeredCount++;
        if (isCorrect) score++;

        answers.push({
            question: i + 1,
            questionText: currentQuestions[i].question,
            yourAnswer: document.getElementById(`q${i + 1}`).value.trim(),
            isCorrect,
            correctAnswer: currentQuestions[i].answer
        });
    }

    document.getElementById('progress').textContent = `Answered: ${answeredCount} / 10`;
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('score').textContent = `Your Score: ${score} / 10`;

    const correctionBody = document.getElementById('correctionBody');
    correctionBody.innerHTML = '';

    answers.forEach(a => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${a.question}</td>
            <td>${a.questionText}</td>
            <td>${a.yourAnswer || '<em>Not answered</em>'}</td>
            <td class="${a.isCorrect ? 'correct' : 'wrong'}">${a.isCorrect ? 'Correct' : 'Wrong'}</td>
            <td>${a.correctAnswer}</td>
        `;
        correctionBody.appendChild(row);
    });
}

function openPrintModal() {
    const printConfirmed = confirm('Do you want to print the quiz result?');
    if (printConfirmed) {
        printResult();
    }
}

function closePrintModal() {
    // Modal closed
}

function printResult() {
    const studentName = localStorage.getItem('quizStudentName');
    const courseSection = localStorage.getItem('quizCourseSection');
    const quizDate = localStorage.getItem('quizDate');

    let questionsHtml = '';
    document.getElementById('correctionBody').querySelectorAll('tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        questionsHtml += `<tr>
            <td>${cells[0].textContent}</td>
            <td>${cells[1].textContent}</td>
            <td>${cells[2].textContent || '<em>Not answered</em>'}</td>
            <td style="color: ${cells[3].classList.contains('correct') ? '#006400' : '#8b0000'}; font-weight: bold;">${cells[3].textContent}</td>
            <td>${cells[4].textContent}</td>
        </tr>`;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>General Knowledge Quiz Result</title>
            <style>
                body { font-family: 'Inter', sans-serif; padding: 20px; background: #fff; color: #000; }
                .result-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
                .result-header h1 { font-size: 24px; margin-bottom: 5px; color: #333; }
                .result-header h2 { font-size: 18px; color: #333; margin: 5px 0; }
                .student-info { margin-bottom: 20px; }
                .student-info p { margin: 5px 0; }
                .score { font-size: 20px; font-weight: bold; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 12px; }
                th { background: #f0f0f0; color: #000; }
            </style>
        </head>
        <body>
            <div class="result-header">
                <h1>General Knowledge Quiz Result</h1>
                <div class="score">Score: ${score} / 10</div>
                <h2>Student Information</h2>
            </div>
            <div class="student-info">
                <p><strong>Student Name:</strong> ${studentName}</p>
                <p><strong>Course / Section:</strong> ${courseSection}</p>
                <p><strong>Date:</strong> ${quizDate}</p>
            </div>
            <h2>Quiz Questions with Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Question</th>
                        <th>Your Answer</th>
                        <th>Result</th>
                        <th>Correct Answer</th>
                    </tr>
                </thead>
                <tbody>
                    ${questionsHtml}
                </tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}