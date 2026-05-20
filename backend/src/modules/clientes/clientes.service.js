import { ApiError } from '../../shared/utils/apiError.js'
import { ClientesRepository } from './clientes.repo.js'

export class ClientesService {
    constructor () {
        this.repo = new ClientesRepository()
    }

    async nuevoPago(data) {
        console.log('Creando nuevo pago con data:', data)
        console.log('Validando si el pago ya existe:', data.pago.contrato)
        if (await this.repo.findPagoByContract(data.pago.contrato)) {
            throw new ApiError(409, 'Pago ya existe')
        }

        const pago = {
            ...data.pago,
            fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
        }

        const nuevoPago = await this.repo.nuevoPago(pago)

        return { nuevoPago }
    }
}