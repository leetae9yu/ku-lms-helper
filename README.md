# KU LMS Helper

> Korea University LMS (mylms.korea.ac.kr)를 위한 퀴즈 및 자막 추출 도구  
> Quiz and transcript extraction tool for Korea University LMS (mylms.korea.ac.kr)

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](./package.json) [![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

---

## Table of Contents

- [Features / 주요 기능](#features--주요-기능)
- [Installation / 설치](#installation--설치)
- [Usage / 사용법](#usage--사용법)
- [Screenshots / 스크린샷](#screenshots--스크린샷)
- [Output Formats / 출력 형식](#output-formats--출력-형식)
- [Development / 개발](#development--개발)
- [File Structure / 파일 구조](#file-structure--파일-구조)
- [Keyboard Shortcuts / 키보드 단축키](#keyboard-shortcuts--키보드-단축키)
- [Troubleshooting / 문제 해결](#troubleshooting--문제-해결)
- [Privacy / 개인정보 보호](#privacy--개인정보-보호)
- [License / 라이선스](#license--라이선스)

---

## Features / 주요 기능

| Feature | Description | 설명 |
|---------|-------------|------|
| **Quiz Extraction** | Extract questions, answers, and explanations from quiz result pages | 퀴즈 결과 페이지에서 문제, 답변, 해설을 추출합니다 |
| **Transcript Extraction** | Download lecture transcripts with timestamps | 강의 동영상의 자막과 타임스탬프를 다운로드합니다 |
| **One-Click Export** | Save as TXT or JSON with a single click | 한 번의 클릭으로 TXT 또는 JSON으로 저장합니다 |
| **Dark Mode** | Automatic theme matching with your system | 시스템 설정에 맞춰 자동으로 다크 모드를 지원합니다 |
| **Privacy First** | All processing happens locally on your device | 모든 처리가 로컬에서 이루어지며 외부 서버와 통신하지 않습니다 |
| **No Extra Login** | Uses your existing LMS session | 별도의 로그인 없이 기존 LMS 세션을 사용합니다 |

---

## Installation / 설치

### Method 1: Chrome Web Store (Coming Soon) / 크롬 웹 스토어 (준비중)

1. Visit Chrome Web Store
2. Search for "KU LMS Helper"
3. Click "Add to Chrome"

### Method 2: Developer Mode (Current) / 개발자 모드 (현재 방법)

1. Download the latest release or clone this repository
   ```bash
   git clone https://github.com/yourusername/ku-lms-helper.git
   cd ku-lms-helper
   ```

2. Build the extension
   ```bash
   npm install
   npm run build
   ```

3. Open Chrome and go to `chrome://extensions/`

4. Enable "Developer mode" (toggle in top-right corner)
   > 우측 상단의 "개발자 모드"를 활성화하세요

5. Click "Load unpacked" and select the `dist/` folder
   > "압축해제된 확장 프로그램을 로드합니다"를 클릭하고 `dist/` 폴더를 선택하세요

6. The extension icon should appear in your Chrome toolbar
   > 확장 프로그램 아이콘이 크롬 도구 모음에 표시됩니다

---

## Usage / 사용법

### Quiz Extraction / 퀴즈 추출

**English:**
1. Go to a quiz result page on KU LMS (e.g., `https://*.korea.ac.kr/...`)
2. Click the KU LMS Helper extension icon in your toolbar
3. Click the **"퀴즈 추출하기"** (Extract Quiz) button
4. Choose your preferred format:
   - **TXT**: Human-readable format
   - **JSON**: Structured data for further processing
5. The file will automatically download to your default folder

**한국어:**
1. 고려대 LMS의 퀴즈 결과 페이지로 이동하세요
2. 도구 모음의 KU LMS Helper 확장 프로그램 아이콘을 클릭하세요
3. **"퀴즈 추출하기"** 버튼을 클릭하세요
4. 원하는 형식을 선택하세요:
   - **TXT**: 사람이 읽기 쉬운 형식
   - **JSON**: 추가 처리를 위한 구조화된 데이터
5. 파일이 기본 다운로드 폴더에 자동으로 저장됩니다

### Transcript Extraction / 자막 추출

**⚠️ Important / 중요:**
Due to browser security policies (Same-Origin Policy), the extension **cannot access the video player directly**. You must **manually open the transcript panel** before extraction.

브라우저 보안 정책(Same-Origin Policy)으로 인해 확장 프로그램이 **비디오 플레이어에 직접 접근할 수 없습니다**. 추출 전 **자막 패널을 수동으로 열어야** 합니다.

**English:**
1. Navigate to a lecture video page with subtitles
2. **Click the transcript button** (자막) on the video player to open the transcript panel
3. Click the KU LMS Helper extension icon
4. Click the **"자막 추출하기"** (Extract Transcript) button
5. The transcript file will automatically download

**한국어:**
1. 자막이 있는 강의 동영상 페이지로 이동하세요
2. 비디오 플레이어에서 **자막 버튼(자막)을 클릭**하여 자막 패널을 여세요
3. KU LMS Helper 확장 프로그램 아이콘을 클릭하세요
4. **"자막 추출하기"** 버튼을 클릭하세요
5. 자막 파일이 자동으로 다운로드됩니다

---

## Screenshots / 스크린샷

> ![Extension Popup - Light Mode](./screenshots/popup-light.png)
> *Extension popup in light mode / 라이트 모드의 확장 프로그램 팝업*

> ![Extension Popup - Dark Mode](./screenshots/popup-dark.png)
> *Extension popup in dark mode / 다크 모드의 확장 프로그램 팝업*

> ![Quiz Extraction Result](./screenshots/quiz-example.png)
> *Example of extracted quiz data / 추출된 퀴즈 데이터 예시*

---

## Output Formats / 출력 형식

### Quiz TXT Format / 퀴즈 TXT 형식

```
========================================
Quiz Title: 중간고사 - 1주차
Total Questions: 10
Date: 2024-03-15
========================================

[Question 1]
Q: What is the main topic of this lecture?
   이 강의의 주제는 무엇인가요?

Your Answer: A
Correct Answer: B

Explanation:
The lecture primarily discusses...
이 강의는 주로 ...에 대해 다룹니다.

----------------------------------------

[Question 2]
...
```

### Quiz JSON Format / 퀴즈 JSON 형식

```json
{
  "title": "중간고사 - 1주차",
  "date": "2024-03-15",
  "totalQuestions": 10,
  "questions": [
    {
      "number": 1,
      "question": "What is the main topic?",
      "questionKo": "이 강의의 주제는 무엇인가요?",
      "yourAnswer": "A",
      "correctAnswer": "B",
      "isCorrect": false,
      "explanation": "The lecture primarily discusses..."
    }
  ]
}
```

### Transcript TXT Format / 자막 TXT 형식

```
========================================
Lecture: Introduction to Economics
Duration: 45:30
Extracted: 2024-03-15
========================================

[00:00:05] 안녕하세요. 오늘은 경제학의 기본 개념에 대해 알아보겠습니다.
[00:00:15] Hello everyone. Today we will learn about basic concepts of economics.

[00:01:30] 먼저, 수요와 공급의 법칙부터 시작하겠습니다.
[00:01:35] First, let's start with the law of supply and demand.

...
```

### Transcript JSON Format / 자막 JSON 형식

```json
{
  "title": "Introduction to Economics",
  "duration": "45:30",
  "extractedAt": "2024-03-15T10:30:00Z",
  "segments": [
    {
      "timestamp": "00:00:05",
      "text": "안녕하세요. 오늘은 경제학의 기본 개념에 대해 알아보겠습니다.",
      "textEn": "Hello everyone. Today we will learn about basic concepts of economics."
    },
    {
      "timestamp": "00:01:30",
      "text": "먼저, 수요와 공급의 법칙부터 시작하겠습니다.",
      "textEn": "First, let's start with the law of supply and demand."
    }
  ]
}
```

---

## Development / 개발

### Prerequisites / 사전 요구사항

- Node.js 18 or higher
- npm or pnpm
- Chrome browser

### Setup / 설정

```bash
# Clone the repository
# 저장소를 복제합니다
git clone https://github.com/yourusername/ku-lms-helper.git
cd ku-lms-helper

# Install dependencies
# 의존성을 설치합니다
npm install

# Run in development mode
# 개발 모드로 실행합니다
npm run dev
```

### Build / 빌드

```bash
# Build for production
# 프로덕션용으로 빌드합니다
npm run build

# The `dist/` folder will contain the built extension
# `dist/` 폴더에 빌드된 확장 프로그램이 생성됩니다
```

### Type Checking / 타입 검사

```bash
npm run typecheck
```

---

## File Structure / 파일 구조

```
ku-lms-helper/
├── public/
│   └── manifest.json          # Extension manifest
├── src/
│   ├── background/
│   │   └── index.ts           # Service worker
│   ├── content/
│   │   ├── index.ts           # Content script entry
│   │   └── detector.ts        # Page type detector
│   ├── lib/
│   │   ├── index.ts           # Shared utilities
│   │   ├── download.ts        # File download utilities
│   │   ├── page-types.ts      # Page type definitions
│   │   ├── quiz/
│   │   │   └── extractor.ts   # Quiz extraction logic
│   │   └── transcript/
│   │       └── extractor.ts   # Transcript extraction logic
│   ├── popup/
│   │   ├── index.html         # Popup HTML
│   │   ├── main.ts            # Popup script
│   │   └── popup.css          # Popup styles
│   └── styles/
│       └── *.css              # Shared styles
├── dist/                      # Build output
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Keyboard Shortcuts / 키보드 단축키

Currently, the extension does not have keyboard shortcuts. All interactions are done through the popup interface.

> 현재 이 확장 프로그램은 키보드 단축키를 지원하지 않습니다. 모든 상호작용은 팝업 인터페이스를 통해 이루어집니다.

Future versions may include:
- `Ctrl+Shift+Q`: Quick quiz extraction
- `Ctrl+Shift+T`: Quick transcript extraction

---

## Troubleshooting / 문제 해결

### Extension not working / 확장 프로그램이 작동하지 않음

| Issue / 문제 | Solution / 해결 방법 |
|-------------|---------------------|
| "Not a valid LMS page" error | Make sure you are on `*.korea.ac.kr` domain / `*.korea.ac.kr` 도메인에 있는지 확인하세요 |
| Download not starting | Check browser download permissions / 브라우저 다운로드 권한을 확인하세요 |
| Blank popup | Refresh the page and try again / 페이지를 새로고침하고 다시 시도하세요 |

### Quiz extraction not working / 퀴즈 추출이 안 됨

**English:**
- Ensure you are on a quiz result page (not the quiz taking page)
- The page URL should contain patterns like `/quiz/` or `/exam/`
- Check that quiz results are visible on the page

**한국어:**
- 퀴즈 결과 페이지에 있는지 확인하세요 (퀴즈 응시 페이지가 아님)
- 페이지 URL에 `/quiz/` 또는 `/exam/`이 포함되어야 합니다
- 페이지에 퀴즈 결과가 표시되는지 확인하세요

### Transcript extraction not working / 자막 추출이 안 됨

**English:**
- Make sure the lecture video has subtitles available
- Some videos may not have transcript data
- Try refreshing the page if the video just loaded

**한국어:**
- 강의 동영상에 자막이 있는지 확인하세요
- 일부 동영상에는 자막 데이터가 없을 수 있습니다
- 동영상이 방금 로드된 경우 페이지를 새로고침해 보세요

### Reporting Issues / 문제 보고

If you encounter any issues not listed here:

1. Check the browser console for error messages (F12 > Console)
2. Take a screenshot of the error
3. Create an issue on GitHub with:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Error messages (if any)

여기에 없는 문제가 발생하면:

1. 브라우저 콘솔에서 오류 메시지를 확인하세요 (F12 > 콘솔)
2. 오류 화면을 캡처하세요
3. GitHub에 이슈를 생성하세요. 다음 정보를 포함하세요:
   - 브라우저 버전
   - 확장 프로그램 버전
   - 재현 단계
   - 오류 메시지 (있는 경우)

---

## Privacy / 개인정보 보호

**English:**

KU LMS Helper respects your privacy:

- **No external servers**: All data processing happens locally in your browser
- **No tracking**: We do not use any analytics or tracking tools
- **No data collection**: We do not collect or transmit any personal information
- **Session-only**: The extension only accesses your existing LMS session
- **Open source**: You can audit the code yourself

Permissions explained:
- `storage`: To save your preferences locally
- `host_permissions`: To access KU LMS pages only

**한국어:**

KU LMS Helper는 여러분의 개인정보를 존중합니다:

- **외부 서버 없음**: 모든 데이터 처리는 브라우저에서 로컬로 이루어집니다
- **추적 없음**: 분석 또는 추적 도구를 사용하지 않습니다
- **데이터 수집 없음**: 개인 정보를 수집하거나 전송하지 않습니다
- **세션 전용**: 기존 LMS 세션에만 접근합니다
- **오픈 소스**: 코드를 직접 검토할 수 있습니다

권한 설명:
- `storage`: 설정을 로컬에 저장하기 위함
- `host_permissions`: 고려대 LMS 페이지에만 접근하기 위함

---

## License / 라이선스

This project is licensed under the MIT License.

> 이 프로젝트는 MIT 라이선스를 따릅니다.

```
MIT License

Copyright (c) 2024 KU LMS Helper Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Acknowledgments / 감사의 말

- Built for Korea University students
- Inspired by the need for better LMS tools
- Thanks to all contributors and testers

---

**Made with care for KU students**  
**고려대 학생들을 위해 정성껏 만들었습니다**

For questions or support, please open an issue on GitHub.  
질문이나 지원이 필요하시면 GitHub에 이슈를 열어주세요.
