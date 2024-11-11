import express from 'express'

import {config} from 'dotenv'
config({ path: path.resolve('./config/.env')})
import path from 'path'
import { initiateApp } from './src/utils/initiatApp.js'

const app = express()

initiateApp(app, express)