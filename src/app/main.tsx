import { FC } from 'react'
import { CV } from 'widgets/CV/ui/entry/main'
import { Provider } from 'react-redux'
import { store } from './store'
import './main.css'
import './variables.css'

export const App: FC = () => {
  return (
    <Provider store={store}>
      <CV />  
    </Provider>
  )
}