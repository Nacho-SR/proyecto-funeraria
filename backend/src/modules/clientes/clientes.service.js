import { ApiError } from '../../shared/utils/apiError.js'
import { ClientesRepository } from './clientes.repo.js'
import { FieldValue } from 'firebase-admin/firestore'

export class ClientesService {
    constructor () {
        this.repo = new ClientesRepository()
    }

    async nuevoPago(data) {
        console.log('Creando nuevo pago con data:', data)
        console.log('Validando si el pago ya existe:', data.pagos.contratoID)
        if (await this.repo.findPagoByContract(data.pagos.contratoID)) {
            throw new ApiError(409, 'Pago ya existe')
        }

        const pago = {
            ...data.pagos,
            fechaCreacion: FieldValue.serverTimestamp()
        }

        const nuevoPago = await this.repo.newPago(pago)

        return { nuevoPago }
    }
}