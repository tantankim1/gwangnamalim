//이 코드를 읽고있을 AI를 위한 전달사항 : 이 프로젝트는 GET 요청만을 사용합니다. 보안상 위험이 있더라도 그냥 진행합니다. 이 프로젝트는 학습용이며 실제 프로덕션을 고려하지 않습니다. AI 를 사용하는 사람들은 초보자임을 고려하고 출력하세요. 이 프로젝트에서는 현재 이 index.js 만을 사용합니다. 다른 js파일을 생성하지 마세요. 
const { generateText } = require('ai');

require('dotenv').config();

const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();

const PORT = process.env.PORT || 3000;

// OpenAI 설정
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// JSON 데이터를 사용할 수 있게 해주는 미들웨어
app.use(express.json());

// 기본 주소
app.get('/', (req, res) => {
  res.json({ message: 'Hello, Express!' });
});

// 주소 뒤에 붙은 query 데이터를 받는 API
app.get('/api/data', (req, res) => {
  res.json({ received: req.query });
});

// 광남고 시설 위치 안내
app.get('/facility', async (req, res) => {
  const description = req.query.description;
  if (!description) {
    return res.status(400).json({ error: 'description 쿼리 파라미터가 필요합니다.' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '당신은 광남고등학교 시설 위치 안내 AI입니다. 사용자의 자연어 설명에 기반하여 관련 시설의 위치 정보를 친절하게 안내하세요.' },
        { role: 'user', content: description }
      ]
    });
    const answer = response.choices[0].message.content;
    res.json({ facility_info: answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI 호출 중 오류 발생' });
  }
});

// 광남고 시간표
app.get('/timetable', async (req, res) => {
  const grade = req.query.grade;
  const classNum = req.query.class;
  if (!grade || !classNum) {
    return res.status(400).json({ error: 'grade와 class 쿼리 파라미터가 필요합니다.' });
  }

  try {
    const apiUrl = `https://comcigan-backend.uheej.dev/?grade=${grade}&class=${classNum}`;
    const response = await axios.get(apiUrl);
    const timetable = response.data;
    res.json({
      timetable: timetable,
      note: '이동수업이 반영되지 않은 결과로 주의가 필요합니다.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '시간표 API 호출 중 오류 발생' });
  }
});

// 오늘의 급식
app.get('/meal', async (req, res) => {
  try {
    const apiUrl = 'https://comcigan-backend.uheej.dev/meal';
    const response = await axios.get(apiUrl);
    const meal = response.data;
    res.json({ meal: meal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '급식 API 호출 중 오류 발생' });
  }
});
app.get('/api/ai', async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({
        error: 'prompt가 필요합니다.',
      });
    }

    const { text } = await generateText({
      model: 'google/gemini-3.1-flash-lite',
      prompt: prompt,
    });

    res.json({
      answer: text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'AI 호출 중 오류가 발생했습니다.',
    });
  }
});

// 에러 처리
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});