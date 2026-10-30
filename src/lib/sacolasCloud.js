import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, collection, doc, onSnapshot, writeBatch, deleteDoc, serverTimestamp } from 'firebase/firestore'

// Config pública do app web no Firebase (não é segredo: quem protege os dados são as
// regras do Firestore — ver firestore.rules — que só liberam e-mails cadastrados).
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
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

// Um documento por mês × loja: { mes, loja, inicial, compradas, sobra, necessarias }
const COLECAO = 'sacolas_mensal'

export const observarUsuario = (cb) => onAuthStateChanged(auth, cb)
export const entrar = () => signInWithPopup(auth, provider)
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
