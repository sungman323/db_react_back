const express = require('express'); // express 기본 라우팅
const app = express(); // express 기본 라우팅
const port = 9070;

const cors = require('cors'); // 교차출처공유 허용
app.use(cors());
app.use(express.json());

const mysql = require('mysql'); // mysql변수 선언
const bcrypt = require('bcrypt'); // 해시 암호화
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'test';

const connection = mysql.createConnection({
  host:'db-react-mariadb:3306',
  user:'root',
  password:'1234',
  database:'kdt'
});

connection.connect((err)=>{
  if(err){
    console.log('MYSQL 연결 실패 :', err);
    return;
  } else {
    console.log('MYSQL 연결 성공');
  }
});

// 로그인 폼에서 post방식으로 전달받은 데이터를 DB에 조회해 결과값을 리턴함
app.post('/login', async(req, res) => {
  const {username, password} = req.body;
  connection.query('SELECT * FROM users WHERE username=?', [username], async(err, result)=>{
    if(err||result.length===0){
      return res.status(401).json({error:'아이디 또는 비밀번호를 확인해주세요.'});
    }

    const users = result[0];
    const isMatch = await bcrypt.compare(password, users.password);

    if(!isMatch){
      return res.status(401).json({error : '아이디 또는 비밀번호를 확인해주세요.'})
    }

    const token = jwt.sign({id:users.id, username:users.username}, SECRET_KEY, {expiresIn:'1h'});
    res.json({token});
  })
});

// 회원가입
app.post('/loginregister', async(req, res) => {
  const {username, password} = req.body;
  const hash = await bcrypt.hash(password, 10);

  connection.query('INSERT INTO users(username, password) VALUES (?, ?)', [username, hash],
    (err) => {
      if(err){
        if(err.code == 'ER_DUP_ENTRY'){
          return res.status(400).json({error:'이미 존재하는 아이디 입니다.'});
        }
        return res.status(500).json({error:'회원가입 실패'})
      }
      res.json({success:true});
    }
  )
})

// 로그인2
app.post('/login2', async(req, res) => {
  const {username, password} = req.body;
  connection.query('SELECT * FROM users2 WHERE username=?', [username], async(err, result)=>{
    if(err||result.length===0){
      return res.status(401).json({error:'아이디 또는 비밀번호를 확인해주세요.'});
    }

    const users = result[0];
    const isMatch = await bcrypt.compare(password, users.password);

    if(!isMatch){
      return res.status(401).json({error : '아이디 또는 비밀번호를 확인해주세요.'})
    }

    const token = jwt.sign({id:users.id, username:users.username}, SECRET_KEY, {expiresIn:'1h'});
    res.json({token});
  })
});

// 회원가입2
app.post('/register2', async(req, res) => {
  const {username, password, tel, email} = req.body;
  const hash = await bcrypt.hash(password, 10);

  connection.query('INSERT INTO users2(username, password, tel, email) VALUES (?, ?, ?, ?)', [username, hash, tel, email],
    (err) => {
      if(err){
        if(err.code == 'ER_DUP_ENTRY'){
          return res.status(400).json({error:'이미 존재하는 아이디 입니다.'});
        }
        return res.status(500).json({error:'회원가입 실패'})
      }
      res.json({success:true});
    }
  )
})


// mysql db연결 테스트 - 메세지만 확인하기 위함
// app.get('/', (req,res)=>{
//   // 특정 경로로 요청된 정보를 처리
//   res.json('Excused form Backend');
// });

// SQL쿼리문을 사용하여 DB에서 조회된 데이터를 출력
app.get('/goods', (req,res) => {
  connection.query("SELECT * FROM goods", (err, results) =>{
    if(err){ 
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    else res.json(results);
  })
});

// 2. 상품 삭제(Delete)
// 상품코드를 기준으로 삭제
app.delete('/goods/:g_code', (req,res)=>{
  const g_code = req.params.g_code;
  connection.query("DELETE FROM goods WHERE g_code=?",[g_code],
    (err, results)=>{
      if(err){
        console.log('삭제 오류 :', err);
        res.status(500).json({error: '상품 삭제 실패'});
        return;
      }
      else res.json({success:true});
    })
});

// 3. 상품 수정(Update)
app.get('/goods/:g_code', (req,res) => {
  const g_code = req.params.g_code;
  connection.query("SELECT * FROM goods WHERE g_code = ?",[g_code], (err, results) =>{
    if(err){ 
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    else res.json(results[0]);
  })
});

app.put('/goods/update/:g_code', (req,res) => {
  const g_code = req.params.g_code;
  const {g_name, g_cost} = req.body;
  connection.query("UPDATE goods SET g_name = ?, g_cost = ? WHERE g_code = ?",[g_name, g_cost, g_code],
    (err, results) => {
      if(err){
        console.log('수정 오류 :', err);
        res.status(500).json({error: '상품 수정 실패'});
        return;
      }
      else res.json({success:true});
    }
  )
});

// 4. 상품 추가 (Create)
app.post('/goods', (req,res) => {
  const {g_name, g_cost} = req.body;
  if(!g_name||!g_cost) return res.status(400).json({error:'필수 항목 누락'});
  connection.query("INSERT INTO goods (g_name, g_cost) VALUES (?, ?)",[g_name, g_cost],
    (err, results) => {
      if(err){
        console.log('등록 오류 :', err);
        res.status(500).json({error: '상품 등록 실패'});
        return;
      }
      else res.json({success:true});
    }
  )
});

// Q&A 등록
app.post('/question', (req,res) => {
  const {q_name, q_tel, q_email, q_text} = req.body;
  if(!q_name || !q_tel || !q_email || !q_text) return res.status(400).json({error:'필수 항목 누락'});
  connection.query("INSERT INTO question (q_name, q_tel, q_email, q_text) VALUES (?, ?, ?, ?)",[q_name, q_tel, q_email, q_text],
    (err, results) => {
      if(err){
        console.log('등록 오류 :', err);
        res.status(500).json({error: '질문 등록 실패'});
        return;
      } else res.json({success:true});
    }
  )
})

app.get('/question', (req,res) => {
  connection.query("SELECT * FROM question", (err, results) =>{
    if(err){ 
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    else res.json(results);
  })
});

//1. 상품목록 조회하기(books)
app.get('/books', (req, res) => {
  connection.query("SELECT * FROM book_store ORDER BY book_store.num DESC", (err,   results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    res.json(results);
  })
});

//1. 상품목록 조회하기(fruits)
app.get('/fruits', (req, res) => {
  connection.query("SELECT * FROM fruit ORDER BY fruit.num DESC", (err,   results)=>{
    if(err){
      console.log('쿼리문 오류 : ', err);
      res.status(500).json({error: 'DB쿼리 오류'});
      return;
    }
    //json데이터로 결과를 저장
    res.json(results);
  })
});

//2. 상품삭제(books)
app.delete('/books/:num', (req, res) => {
  const num = req.params.num;
  connection.query(
    'DELETE FROM book_store where num=?', [num], (err, result) => {
      if(err){
        console.log('삭제 오류 : ', err);
        res.status(500).json({err : '상품 삭제 실패'});
        return;
      }
      res.json({success:true});
    }
  )
});

//2. 상품삭제(fruit)
app.delete('/fruits/:num', (req, res) => {
  const num = req.params.num;
  connection.query(
    'DELETE FROM fruit where num=?', [num], (err, result) => {
      if(err){
        console.log('삭제 오류 : ', err);
        res.status(500).json({err : '상품 삭제 실패'});
        return;
      }
      res.json({success:true});
    }
  )
});

//3. 상품수정 books(update)
app.put('/books/update/:num', (req, res)=>{
  const num = req.params.num;
  const { name, area1, area2, area3, book_cnt, owner_nm, tel_num } = req.body;

  // 필수값 체크
  if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  connection.query(
    'UPDATE book_store SET name=?, area1=?, area2=?, area3=?, BOOK_CNT=?, owner_nm=?, tel_num=? WHERE num=?',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});

//3. 상품수정 fruits(update)
app.put('/fruits/update/:num', (req, res)=>{
  const num = req.params.num;
  const { name, price, color, country } = req.body;

  // 필수값 체크
  if (!name || !price || !color || !country) {
    return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  connection.query(
    'UPDATE fruit SET name=?, price=?, color=?, country=? WHERE num=?',
    [name, price, color, country, num],
    (err, result) => {
      if (err) {
        console.log('수정 오류 : ', err);
        res.status(500).json({ error: '상품 수정하기 실패' });
        return;
      }
      res.json({ success: true });
    }
  );
});


//4. fruits 상품 조회하기 (SELECT)
app.get('/fruits/:num', (req, res) => {
  const num = req.params.num;

  connection.query(
    'SELECT * FROM fruit WHERE num = ?',
    [num],
    (err, results) => {
      if (err) {
        console.log('조회 오류:', err);
        res.status(500).json({ error: '상품 조회 실패' });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ error: '해당 상품이 없습니다.' });
        return;
      }

      res.json(results[0]); // 단일 객체만 반환
    }
  )
});


//5. books 상품등록하기
app.post('/books', (req, res)=>{
  const{name, area1, area2, area3, book_cnt, owner_nm, tel_num} = req.body;
  if (!name || !area1 || !area2 || !area3 || !book_cnt || !owner_nm || !tel_num) {
  return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

//book_store db입력을 위한 쿼리문 실행
  connection.query(
    'INSERT INTO book_store (name, area1, area2, area3, BOOK_CNT, owner_nm, tel_num) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, area1, area2, area3, book_cnt, owner_nm, tel_num],
    (err, result) => {
      if (err) {
        console.log('등록 오류:', err);
        res.status(500).json({ error: '상품 등록 실패' });
        return;
      }
      res.json({ success: true, insertedId: result.insertId });
    }
  );
});

//5. fruits 상품등록하기
app.post('/fruits', (req, res)=>{
  const{name, price, color, country} = req.body;
  if (!name || !price || !color || !country) {
  return res.status(400).json({ error: '필수 항목이 누락되었습니다. 다시 확인하세요.' });
  }

  // fruit db입력을 위한 쿼리문 실행
  connection.query(
    'INSERT INTO fruit (name, price, color, country) VALUES (?, ?, ?, ?)',
    [name, price, color, country],
    (err, result) => {
      if (err) {
        console.log('등록 오류:', err);
        res.status(500).json({ error: '상품 등록 실패' });
        return;
      }
      res.json({ success: true, insertedId: result.insertId });
    }
  )  
});


app.listen(port, () => {
  console.log('Listening...');
});
