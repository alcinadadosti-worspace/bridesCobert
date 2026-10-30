import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, collection, doc, onSnapshot, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore'

// Config pública do app web no Firebase (não é segredo: quem protege os dados são as
// regras do Firestore — ver firestore.rules — que só liberam usuários cadastrados).
const firebaseConfig = {
  apiKey: 'AIzaSyAzDr1vEFk_XPGV8Qw4zd5CqAX4HgOhfQg',
  authDomain: 'sacolas-b5dc9.firebaseapp.com',
  projectId: 'sacolas-b5dc9',
  storageBucket: 'sacolas-b5dc9.firebasestorage.app',
  messagingSenderId: '366550355909',
  appId: '1:366550355909:web:14c81a7b91c7446d0605ac',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Um documento por mês × loja: { mes, loja, inicial, compradas, sobra, necessarias }
const COLECAO = 'sacolas_mensal'

// Login por usuário e senha. O Firebase exige e-mail, então "fulano" vira
// "fulano@sacolas-b5dc9.firebaseapp.com" — endereço interno do projeto, que não recebe
// e-mail. As contas são criadas no console (Authentication → Users).
const DOMINIO_USUARIO = 'sacolas-b5dc9.firebaseapp.com'
export const usuarioDe = (user) => (user?.email || '').split('@')[0]

export const observarUsuario = (cb) => onAuthStateChanged(auth, cb)
export const entrar = (usuario, senha) => signInWithEmailAndPassword(auth, `${usuario}@${DOMINIO_USUARIO}`, senha)
export const sair = () => signOut(auth)

export function observarRegistros(onData, onError) {
  return onSnapshot(
    collection(db, COLECAO),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  )
}

// lista: [{ id, dados }] — grava tudo de uma vez (merge, para não apagar campos que outra
// pessoa tenha salvo, ex.: necessárias vindas da conferência)
export async function salvarRegistros(lista, email) {
  const batch = writeBatch(db)
  for (const { id, dados } of lista) {
    batch.set(doc(db, COLECAO, id), { ...dados, atualizadoEm: serverTimestamp(), atualizadoPor: email || null }, { merge: true })
  }
  await batch.commit()
}

export const excluirRegistro = (id) => deleteDoc(doc(db, COLECAO, id))

// tira uma planilha do mês: `limpar` = [{ id, dados }] com os campos dela em null;
// `apagar` = ids que ficariam vazios e são removidos — tudo de uma vez
export async function removerDoMes(limpar, apagar, usuario) {
  const batch = writeBatch(db)
  for (const { id, dados } of limpar) {
    batch.set(doc(db, COLECAO, id), { ...dados, atualizadoEm: serverTimestamp(), atualizadoPor: usuario || null }, { merge: true })
  }
  for (const id of apagar) batch.delete(doc(db, COLECAO, id))
  await batch.commit()
}
