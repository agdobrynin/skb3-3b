import express from 'express';
import cors from 'cors';
require('es6-promise').polyfill();
require('isomorphic-fetch');
import jsonQuery from 'json-query';
import _ from 'lodash';

const app = express();
app.use(cors());

const DbUrl='https://gist.githubusercontent.com/isuvorov/55f38b82ce263836dadc0503845db4da/raw/pets.json';
let Db = {};
let NotFound='Not Found';

fetch(DbUrl)
  .then(async (res) => {
    Db = await res.json();
  })
  .catch(err => {
    console.log('Чтото пошло не так:', err);
  });

//вся база
app.get('/', (req, res) => {
  let result=Db;
  return result? res.json(result) : res.status(404).send(NotFound);
});

//все поьзоватеkи
///users?havePet=cat Пользователи у которых есть коты
app.get('/users', (req, res) =>{

  let result=null, qs=[];
  let data =  _.cloneDeep(Db);

  if(req.query.havePet){
    result=jsonQuery(`[*type=${req.query.havePet}].userId`, {data: data.pets}).value;
    if(result.length){
      let new_qs = result.map( function(e){return 'id='+e;});
      result=jsonQuery(`[* ${new_qs.join(' | ')}]`, {data: data.users}).value;
    }
  }else{
    result=jsonQuery('[* ]', {data: data.users}).value;
  }

  return result? res.json(result) : res.status(404).send(NotFound);
});

//Все пользователи вывести с pets
// /users/populate?havePet=cat се пользователи у которых коты, вывести с pets
app.get('/users/populate', (req, res) =>{

  let result_pets=[], result_users=[], result=[], qs=[];
  let data =  _.cloneDeep(Db);
  //для животных
  if(req.query.havePet){
    qs.push(`type=${req.query.havePet}`);
  }
  if(req.query.age_gt){
    qs.push(`age>${req.query.age_gt}`);
  }
  if(req.query.age_lt){
    qs.push(`age<${req.query.age_lt}`);
  }

  result_pets=jsonQuery(`[* ${qs.join(' & ')}].userId`, {data: data.pets}).value;

  result_users=jsonQuery(`[* id=${result_pets.join(' | id=')}]`, {data: data.users}).value;
  result_users.map( (element, index) => {
    element['pets']=jsonQuery(`[* userId=${element.id}]`, {data: data.pets}).value;
    result.push(element);
  });

  return result? res.json(result) : res.status(404).send(NotFound);
});

//данные пользователя по его ID или по username
app.get('/users/:id', (req, res) =>{
  let result=null;
  let data = _.cloneDeep(Db);

  if(/([0-9]+)/g.test(req.params.id)){
      result=jsonQuery(`[id=${req.params.id}]`, {data: data.users}).value;
    }else{
      result=jsonQuery(`[username=${req.params.id}]`, {data: data.users}).value;
    }

    return result? res.json(result) : res.status(404).send(NotFound);
});

//Получить список животных конкретного пользователя по его username/id
app.get('/users/:id/pets', (req, res) =>{
  res.json({});
});

//Получить данные конкретного пользователя по его username/id, внутри объекта должен лежить массив pets
app.get('/users/:usernameOrId/populate', (req, res) =>{

  let result=null, str_find;
  let data = _.cloneDeep(Db);
  if(/([0-9]+)/i.test(req.params.usernameOrId)){
    str_find=`[id=${req.params.usernameOrId}]`;
  }else{
    str_find=`[username=${req.params.usernameOrId}]`;
  }

  result=jsonQuery(str_find, {data: data.users}).value;

  if(result){
    result['pets']=jsonQuery(`[* userId=${result.id}]`, {data: data.pets}).value;
  }
  console.log( result );

  return result? res.json(result) : res.status(404).send(NotFound);
});

//Получить список животных
// /pets?type=cat  Получить список только котов
// /pets?age_gt=12 Получить животных возраст которых строго больше 12 месяцев
// /pets?age_lt=25 Получить животных возраст которых строго меньше 25 месяцев
app.get('/pets', (req, res) =>{

  let result=null, qs=[];
  let data = _.cloneDeep(Db);

  if(req.query.type){
    qs.push(`type=${req.query.type}`);
  }
  if(req.query.age_gt){
    qs.push(`age>${req.query.age_gt}`);
  }
  if(req.query.age_lt){
    qs.push(`age<${req.query.age_lt}`);
  }
  if(req.query == null ){
    qs=[];
  }

  result=jsonQuery('[* ' + qs.join(' & ') + ']', {data: data.pets}).value;

  return result? res.json(result) : res.status(404).send(NotFound);
});

//Получить список животных Получить животного по его ID
app.get('/pets/:id',  (req, res, next) =>{

  let result=null;
  let data = _.cloneDeep(Db);

  if( req.params.id=='populate' ) return next();

  result=jsonQuery(`[id=${req.params.id}]`, {data: data.pets}).value;

  return result? res.json(result) : res.status(404).send(NotFound);
});

//Получить список животных с пользовательской структурой, положить пользователя в поле user
// /pets/populate?type=cat Популяция с возможностью фильтра
// /pets/populate?type=cat&age_gt=12 Популяция с возможностью фильтра
app.get('/pets/populate', (req, res) =>{
  let result_user=null, result_pets=null,  result=[], qs=[];
  let data = _.cloneDeep(Db);

  if(req.query.type){
    qs.push(`type=${req.query.type}`);
  }
  if(req.query.age_gt){
    qs.push(`age>${req.query.age_gt}`);
  }
  if(req.query.age_lt){
    qs.push(`age<${req.query.age_lt}`);
  }

  result_pets=jsonQuery(`[* ${qs.join(' & ')}]`, {data: data.pets}).value;

  result_pets.map( (element, index) => {
    result_user=jsonQuery(`[id=${element.userId}]`, {data: data.users}).value;
    element['user']=result_user;
    result.push(element);
  });

  return result? res.json(result) : res.status(404).send(NotFound);
});

//Популяция user в pet
app.get('/pets/:id/populate', (req, res) =>{
  let result_user=null, result_pets=null,  result=[], qs=[];
  let data = _.cloneDeep(Db);

 qs.push(`id=${req.params.id}`);

  result_pets=jsonQuery(`[* ${qs.join(' & ')}]`, {data: data.pets}).value;
  result_pets.map( (element, index) => {
    result_user=jsonQuery(`[id=${element.userId}]`, {data: data.users}).value;
    element['user']=result_user;
    return result.push(element);
  });

  return result[0]? res.json(result[0]) : res.status(404).send(NotFound);
});

app.listen(3000, () => {
  console.log('Your app listening on port 3000!');
});
