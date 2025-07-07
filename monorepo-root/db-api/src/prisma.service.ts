import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService — обёртка над PrismaClient для DI
 */
@Injectable()
export class PrismaService extends PrismaClient {} 