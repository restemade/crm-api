import { Controller, Get, Query } from '@nestjs/common';
import { DentistService } from './dentist.service';

@Controller('dentist')
export class DentistController {
    constructor(private readonly dentistService: DentistService) {}

    @Get('auth')
    async auth() {
        return this.dentistService.authorize();
    }

    @Get('branches')
    async branches() {
        return this.dentistService.getBranches();
    }

    @Get('doctors')
    async doctors(@Query() query: Record<string, string>) {
        return this.dentistService.getDoctors(query);
    }
}